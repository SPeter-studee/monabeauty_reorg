// src/pages/api/checkout/index.ts
// POST /api/checkout — rendelés létrehozás
//
// Folyamat:
//   1. Validáció: vendég adatok + tételek + szállítás + fizetés
//   2. Termékek lekérdezése D1-ből (friss árak, készlet ellenőrzés)
//   3. Order number generálás: MS-YYYY-NNNN (4 jegyű sorszám)
//   4. D1: orders + order_items insertion (tranzakció)
//   5. Resend: email vendégnek (megerősítés) + Mónikának (új rendelés)
//   6. Mailchimp: tagek hozzáadás (vasarlas-YYYY-MM + vasarolt-{slug})
//
// Env vars szükségesek:
//   RESEND_API_KEY            — Resend API kulcs
//   ORDER_NOTIFICATION_EMAIL  — Mónika email címe (wrangler.toml)
//   MAILCHIMP_API_KEY         — Mailchimp tag-elésekhez (opcionális, ha hiányzik átugorja)
//   MAILCHIMP_AUDIENCE_ID
//   MAILCHIMP_SERVER

import type { APIRoute } from "astro";
import { getProduct } from "@/lib/products";
import {
  effectivePrice,
  calculateShipping,
  type ShippingMethod,
  type PaymentMethod,
} from "@/lib/types/shop";

interface CheckoutRequest {
  // Vendég adatok
  guestName: string;
  guestEmail: string;
  guestPhone: string;

  // Szállítás
  shippingMethod: ShippingMethod;
  shippingAddress?: string;
  shippingCity?: string;
  shippingZip?: string;

  // Fizetés
  paymentMethod: PaymentMethod;

  // Megjegyzés (opcionális)
  customerNote?: string;

  // Tételek — friss adatokat lekérdezzük D1-ből
  items: Array<{
    productId: number;
    qty: number;
  }>;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;
  const db = (env as any).DB;

  // ─── 1. Body parse + validáció ─────────────────────────────────────
  let body: CheckoutRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Érvénytelen kérés." }, { status: 400 });
  }

  // Kötelező mezők ellenőrzése
  if (!body.guestName?.trim()) {
    return Response.json({ error: "Adj meg egy nevet." }, { status: 400 });
  }
  if (!body.guestEmail?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.guestEmail)) {
    return Response.json({ error: "Érvénytelen email cím." }, { status: 400 });
  }
  if (!body.guestPhone?.trim()) {
    return Response.json({ error: "Adj meg egy telefonszámot." }, { status: 400 });
  }
  if (!["foxpost", "personal"].includes(body.shippingMethod)) {
    return Response.json({ error: "Érvénytelen szállítási mód." }, { status: 400 });
  }
  if (!["transfer", "on_delivery"].includes(body.paymentMethod)) {
    return Response.json({ error: "Érvénytelen fizetési mód." }, { status: 400 });
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return Response.json({ error: "A kosár üres." }, { status: 400 });
  }

  // FoxPost-nál a cím kötelező
  if (body.shippingMethod === "foxpost") {
    if (!body.shippingAddress?.trim() || !body.shippingCity?.trim() || !body.shippingZip?.trim()) {
      return Response.json({ error: "Add meg a szállítási címet." }, { status: 400 });
    }
  }

  // ─── 2. Termékek lekérdezése + készlet ellenőrzés ──────────────────
  const orderItems: Array<{
    productId: number;
    productSlug: string;
    productName: string;
    productImageUrl: string | null;
    qty: number;
    priceAtOrderFt: number;
    subtotalFt: number;
  }> = [];
  let subtotalFt = 0;

  for (const item of body.items) {
    if (typeof item.productId !== "number" || typeof item.qty !== "number" || item.qty <= 0) {
      return Response.json({ error: "Érvénytelen tétel a kosárban." }, { status: 400 });
    }

    // Friss adatok D1-ből — a kliens által küldött árat NEM bízzuk
    const productResult = await db
      .prepare("SELECT * FROM products WHERE id = ? AND is_active = 1")
      .bind(item.productId)
      .first();

    if (!productResult) {
      return Response.json(
        { error: `Az egyik termék már nem elérhető. Kérlek, töltsd újra az oldalt!` },
        { status: 400 }
      );
    }

    const product = productResult as any;

    // Készlet ellenőrzés
    if (product.stock_qty < item.qty) {
      return Response.json(
        { error: `${product.name}: csak ${product.stock_qty} db van készleten.` },
        { status: 400 }
      );
    }

    // Effektív ár (akciós ha van aktív akció)
    const price = effectivePrice({
      priceFt: product.price_ft,
      salePriceFt: product.sale_price_ft,
      saleStartsAt: product.sale_starts_at,
      saleEndsAt: product.sale_ends_at,
    });

    // Kép URL
    const imageResult = await db
      .prepare("SELECT url FROM product_images WHERE product_id = ? AND is_primary = 1 LIMIT 1")
      .bind(item.productId)
      .first<{ url: string }>();
    const imageUrl = imageResult?.url ?? null;

    const itemSubtotal = price * item.qty;
    subtotalFt += itemSubtotal;

    orderItems.push({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      productImageUrl: imageUrl,
      qty: item.qty,
      priceAtOrderFt: price,
      subtotalFt: itemSubtotal,
    });
  }

  // ─── 3. Szállítási költség kiszámítása ────────────────────────────
  const shippingFeeFt = calculateShipping(subtotalFt, body.shippingMethod);
  const totalFt = subtotalFt + shippingFeeFt;

  // ─── 4. Order number generálás (MS-YYYY-NNNN) ─────────────────────
  // Az ID-t a D1 INSERT után tudjuk, ezért előre lekérdezzük
  // a max. order_number-t az aktuális évben:
  const year = new Date().getFullYear();
  const yearPrefix = `MS-${year}-`;

  const lastOrderResult = await db
    .prepare(
      "SELECT order_number FROM orders WHERE order_number LIKE ? ORDER BY id DESC LIMIT 1"
    )
    .bind(`${yearPrefix}%`)
    .first<{ order_number: string }>();

  let nextSeq = 1;
  if (lastOrderResult?.order_number) {
    const lastSeq = parseInt(lastOrderResult.order_number.replace(yearPrefix, ""), 10);
    if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }
  const orderNumber = `${yearPrefix}${String(nextSeq).padStart(4, "0")}`;

  // ─── 5. D1 INSERT — orders + order_items ──────────────────────────
  let orderId: number;
  try {
    const insertOrder = await db
      .prepare(`
        INSERT INTO orders (
          order_number, guest_name, guest_email, guest_phone,
          shipping_method, shipping_address, shipping_city, shipping_zip, shipping_fee_ft,
          payment_method, subtotal_ft, total_ft, status, customer_note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
      `)
      .bind(
        orderNumber,
        body.guestName.trim(),
        body.guestEmail.trim().toLowerCase(),
        body.guestPhone.trim(),
        body.shippingMethod,
        body.shippingAddress?.trim() || null,
        body.shippingCity?.trim() || null,
        body.shippingZip?.trim() || null,
        shippingFeeFt,
        body.paymentMethod,
        subtotalFt,
        totalFt,
        body.customerNote?.trim() || null
      )
      .run();

    orderId = insertOrder.meta.last_row_id as number;

    // Tételek beillesztése
    for (const item of orderItems) {
      await db
        .prepare(`
          INSERT INTO order_items (
            order_id, product_id, product_slug, product_name, product_image_url,
            qty, price_at_order_ft, subtotal_ft
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          orderId,
          item.productId,
          item.productSlug,
          item.productName,
          item.productImageUrl,
          item.qty,
          item.priceAtOrderFt,
          item.subtotalFt
        )
        .run();

      // Készlet csökkentés
      await db
        .prepare("UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?")
        .bind(item.qty, item.productId)
        .run();
    }

    console.log(`[checkout] Order created: ${orderNumber}, total: ${totalFt} Ft`);
  } catch (err) {
    console.error("[checkout] DB error:", err);
    return Response.json(
      { error: "Hiba történt a rendelés rögzítésekor. Kérlek, próbáld újra!" },
      { status: 500 }
    );
  }

  // ─── 6. Resend emailek (vendégnek + Mónikának) ────────────────────
  // Ez függő — ha a Resend hibázik, a rendelés már létre van hozva,
  // csak emailt nem küld. Mónika kézzel utánanézhet.
  await sendEmails(env, {
    orderNumber,
    guestName: body.guestName.trim(),
    guestEmail: body.guestEmail.trim().toLowerCase(),
    guestPhone: body.guestPhone.trim(),
    shippingMethod: body.shippingMethod,
    shippingAddress: body.shippingAddress,
    shippingCity: body.shippingCity,
    shippingZip: body.shippingZip,
    shippingFeeFt,
    paymentMethod: body.paymentMethod,
    subtotalFt,
    totalFt,
    items: orderItems,
    customerNote: body.customerNote,
  }).catch(err => {
    console.error("[checkout] Email error (non-fatal):", err);
  });

  // ─── 7. Mailchimp tagek hozzáadás ─────────────────────────────────
  // Csak ha az email már a listán van (akár pending) — ne hozzunk létre újat.
  await addMailchimpTags(env, body.guestEmail.trim().toLowerCase(), orderItems).catch(err => {
    console.error("[checkout] Mailchimp tag error (non-fatal):", err);
  });

  // ─── 8. Sikeres válasz ────────────────────────────────────────────
  return Response.json({
    success: true,
    orderNumber,
    redirectUrl: `/penztar/koszonjuk?rendeles=${orderNumber}`,
  });
};

// ─────────────────────────────────────────────────────────────────────
// EMAIL KÜLDÉS — Resend
// ─────────────────────────────────────────────────────────────────────

async function sendEmails(env: any, order: any) {
  const apiKey = env.RESEND_API_KEY;
  const adminEmail = env.ORDER_NOTIFICATION_EMAIL ?? "mona@monastudio.hu";

  if (!apiKey) {
    console.warn("[checkout] RESEND_API_KEY hiányzik — email kihagyva");
    return;
  }

  const formatPrice = (ft: number) => `${ft.toLocaleString("hu-HU")} Ft`;

  const itemsHtml = order.items
    .map(
      (i: any) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(i.productName)}</td>
          <td style="padding: 8px; text-align: center; border-bottom: 1px solid #eee;">${i.qty}</td>
          <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">${formatPrice(i.subtotalFt)}</td>
        </tr>`
    )
    .join("");

  const shippingLabel = order.shippingMethod === "foxpost"
    ? "FoxPost csomagautomata"
    : "Személyes átvétel — Vác";
  const paymentLabel = order.paymentMethod === "transfer"
    ? "Átutalás"
    : "Utánvét";

  const shippingAddressBlock = order.shippingMethod === "foxpost"
    ? `<p><strong>Szállítási cím:</strong><br>
        ${escapeHtml(order.shippingAddress || "")}<br>
        ${escapeHtml(order.shippingZip || "")} ${escapeHtml(order.shippingCity || "")}
       </p>`
    : `<p><strong>Átvétel:</strong><br>
        Mona Studio<br>
        2600 Vác, Zrínyi Miklós utca 3.<br>
        <em>Mónika értesít, mikor jöhetsz érte.</em>
       </p>`;

  const transferInfo = order.paymentMethod === "transfer"
    ? `<div style="background: #f5f1e8; padding: 16px; margin: 16px 0; border-left: 3px solid #8a6f4a;">
        <p style="margin: 0 0 8px;"><strong>Utalási adatok:</strong></p>
        <p style="margin: 0;">
          Kedvezményezett: Szabó Mónika E.V.<br>
          Bankszámlaszám: <strong>(elküldjük emailben hamarosan)</strong><br>
          Közlemény: <strong>${order.orderNumber}</strong><br>
          Összeg: <strong>${formatPrice(order.totalFt)}</strong>
        </p>
      </div>`
    : `<div style="background: #fdfbf7; padding: 16px; margin: 16px 0;">
        <p style="margin: 0;">
          <strong>Utánvétes fizetés</strong> — a futárnak fizetsz amikor megérkezik a csomag.
        </p>
      </div>`;

  // ─── Email a vendégnek ────────────────────────────────────────────
  const customerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Rendelés visszaigazolása — ${order.orderNumber}</title>
</head>
<body style="font-family: Georgia, serif; line-height: 1.6; color: #2c2926; background: #ebe5db; padding: 20px;">
  <div style="max-width: 640px; margin: 0 auto; background: #fdfbf7; padding: 32px;">
    <h1 style="font-size: 28px; font-weight: 500; margin: 0 0 8px;">Köszönjük a rendelésedet!</h1>
    <p style="color: #4a4640;">
      Kedves ${escapeHtml(order.guestName)},<br>
      megkaptam a rendelésedet és hamarosan elindítom a feldolgozást.
    </p>

    <p><strong>Rendelési szám:</strong> <span style="font-family: monospace;">${order.orderNumber}</span></p>

    <h2 style="font-size: 18px; margin: 24px 0 8px;">Termékek</h2>
    <table style="width: 100%; border-collapse: collapse; font-family: -apple-system, sans-serif;">
      <thead>
        <tr style="background: #f5f1e8;">
          <th style="padding: 8px; text-align: left;">Termék</th>
          <th style="padding: 8px; text-align: center;">Db</th>
          <th style="padding: 8px; text-align: right;">Ár</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 8px; text-align: right;">Részösszeg:</td>
          <td style="padding: 8px; text-align: right;">${formatPrice(order.subtotalFt)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 8px; text-align: right;">Szállítás (${shippingLabel}):</td>
          <td style="padding: 8px; text-align: right;">${order.shippingFeeFt === 0 ? "Ingyen" : formatPrice(order.shippingFeeFt)}</td>
        </tr>
        <tr style="font-weight: bold; font-size: 18px;">
          <td colspan="2" style="padding: 12px 8px; text-align: right; border-top: 2px solid #2c2926;">Összesen:</td>
          <td style="padding: 12px 8px; text-align: right; border-top: 2px solid #2c2926;">${formatPrice(order.totalFt)}</td>
        </tr>
      </tfoot>
    </table>

    ${shippingAddressBlock}
    ${transferInfo}

    ${order.customerNote ? `<p><strong>Megjegyzésed:</strong><br><em>${escapeHtml(order.customerNote)}</em></p>` : ""}

    <hr style="border: none; border-top: 1px solid #d4cfc4; margin: 24px 0;">

    <p style="color: #4a4640; font-size: 14px;">
      Bármilyen kérdés esetén válaszolj erre az emailre vagy hívj a <strong>+36 20 913 0126</strong> számon.
    </p>
    <p style="color: #6b5a4a; font-size: 13px;">
      — Mónika · Mona Studio<br>
      Vác, Zrínyi Miklós u. 3.
    </p>
  </div>
</body>
</html>
  `.trim();

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Mona Studio <weblap@monastudio.hu>",
      to: [order.guestEmail],
      reply_to: adminEmail,
      subject: `Rendelés visszaigazolása — ${order.orderNumber}`,
      html: customerHtml,
    }),
  });

  // ─── Email Mónikának ──────────────────────────────────────────────
  const adminHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Új rendelés — ${order.orderNumber}</title>
</head>
<body style="font-family: -apple-system, sans-serif; line-height: 1.5; padding: 20px;">
  <h1>🎉 Új rendelés érkezett!</h1>
  <p><strong>Sorszám:</strong> ${order.orderNumber}<br>
     <strong>Vendég:</strong> ${escapeHtml(order.guestName)}<br>
     <strong>Email:</strong> <a href="mailto:${escapeHtml(order.guestEmail)}">${escapeHtml(order.guestEmail)}</a><br>
     <strong>Telefon:</strong> ${escapeHtml(order.guestPhone)}</p>

  <h2>Tételek</h2>
  <table style="border-collapse: collapse; width: 100%;">
    <thead>
      <tr style="background: #f0f0f0;">
        <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Termék</th>
        <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Db</th>
        <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Ár</th>
      </tr>
    </thead>
    <tbody>
      ${order.items.map((i: any) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(i.productName)} (slug: ${escapeHtml(i.productSlug)})</td>
          <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${i.qty}</td>
          <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${formatPrice(i.subtotalFt)}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <p><strong>Szállítás:</strong> ${shippingLabel} (${order.shippingFeeFt === 0 ? "Ingyen" : formatPrice(order.shippingFeeFt)})</p>
  ${order.shippingMethod === "foxpost" ? `<p>Cím: ${escapeHtml(order.shippingAddress || "")}, ${escapeHtml(order.shippingZip || "")} ${escapeHtml(order.shippingCity || "")}</p>` : ""}

  <p><strong>Fizetés:</strong> ${paymentLabel}</p>
  <p><strong>Összesen:</strong> ${formatPrice(order.totalFt)}</p>

  ${order.customerNote ? `<p><strong>Vendég megjegyzése:</strong><br><em>${escapeHtml(order.customerNote)}</em></p>` : ""}
</body>
</html>
  `.trim();

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Mona Studio <weblap@monastudio.hu>",
      to: [adminEmail],
      reply_to: order.guestEmail,
      subject: `🎉 Új rendelés — ${order.orderNumber} (${formatPrice(order.totalFt)})`,
      html: adminHtml,
    }),
  });
}

// ─────────────────────────────────────────────────────────────────────
// MAILCHIMP TAGEK
// Csak ha a vendég email **már** a listán van (most pending vagy subscribed).
// Ha nincs, NEM hozunk létre új feliratkozást — csak tageljük ha létezik.
// ─────────────────────────────────────────────────────────────────────

async function addMailchimpTags(env: any, email: string, items: Array<{ productSlug: string }>) {
  const apiKey = env.MAILCHIMP_API_KEY;
  const audienceId = env.MAILCHIMP_AUDIENCE_ID;
  const server = env.MAILCHIMP_SERVER;

  if (!apiKey || !audienceId || !server) {
    console.warn("[checkout] Mailchimp env vars hiányoznak — tag-elés kihagyva");
    return;
  }

  // MD5 hash az emailről (Mailchimp member lookup-hoz kell)
  const memberHash = await md5(email);

  // 1. Ellenőrzés: létezik-e a kontakt a listán?
  const memberRes = await fetch(
    `https://${server}.api.mailchimp.com/3.0/lists/${audienceId}/members/${memberHash}`,
    {
      headers: {
        Authorization: `Basic ${btoa(`anystring:${apiKey}`)}`,
      },
    }
  );

  if (memberRes.status === 404) {
    // Nincs a listán — most NEM iratkoztatjuk fel automatikusan
    // (csak ha a vendég kifejezetten kérné — Sprint 4-ben opció)
    console.log(`[checkout] ${email} not in Mailchimp — skipping tags`);
    return;
  }

  if (!memberRes.ok) {
    console.error(`[checkout] Mailchimp member check failed: ${memberRes.status}`);
    return;
  }

  // 2. Tagek hozzáadása
  const yearMonth = new Date().toISOString().slice(0, 7); // "2026-04"
  const tagsToAdd = [
    { name: `vasarlas-${yearMonth}`, status: "active" },
    ...items.map(i => ({ name: `vasarolt-${i.productSlug}`, status: "active" as const })),
  ];

  const tagRes = await fetch(
    `https://${server}.api.mailchimp.com/3.0/lists/${audienceId}/members/${memberHash}/tags`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`anystring:${apiKey}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tags: tagsToAdd }),
    }
  );

  if (!tagRes.ok) {
    const data = await tagRes.json().catch(() => ({}));
    console.error(`[checkout] Mailchimp tag add failed:`, data);
    return;
  }

  console.log(`[checkout] Mailchimp tags added for ${email}: ${tagsToAdd.map(t => t.name).join(", ")}`);
}

// ─────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────

async function md5(input: string): Promise<string> {
  // Cloudflare Workers-ben Web Crypto API — de MD5 nincs! Használunk SubtleCrypto-t.
  // Mailchimp lowercase MD5-öt vár.
  const data = new TextEncoder().encode(input.toLowerCase());

  // Sajnos a Web Crypto nem támogatja az MD5-öt, ezért manuális implementáció kell.
  // Ez egy tiszta, rövid MD5 implementáció:
  return md5Hash(input.toLowerCase());
}

// MD5 implementáció (saját) — Mailchimp member hash-hez
function md5Hash(str: string): string {
  function rotateLeft(x: number, n: number): number {
    return (x << n) | (x >>> (32 - n));
  }
  function addUnsigned(x: number, y: number): number {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function f(x: number, y: number, z: number): number { return (x & y) | (~x & z); }
  function g(x: number, y: number, z: number): number { return (x & z) | (y & ~z); }
  function h(x: number, y: number, z: number): number { return x ^ y ^ z; }
  function i(x: number, y: number, z: number): number { return y ^ (x | ~z); }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(i(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function convertToWordArray(str: string): number[] {
    const wordArray: number[] = [];
    const bytes = new TextEncoder().encode(str);
    const len = bytes.length;
    const numWords = (((len + 8) >> 6) + 1) * 16;
    for (let k = 0; k < numWords; k++) wordArray[k] = 0;
    for (let k = 0; k < len; k++) {
      wordArray[k >> 2] |= bytes[k] << ((k % 4) * 8);
    }
    wordArray[len >> 2] |= 0x80 << ((len % 4) * 8);
    wordArray[numWords - 2] = len * 8;
    return wordArray;
  }
  function wordToHex(value: number): string {
    let hex = "";
    for (let k = 0; k <= 3; k++) {
      const byte = (value >>> (k * 8)) & 0xff;
      hex += ("0" + byte.toString(16)).slice(-2);
    }
    return hex;
  }

  const x = convertToWordArray(str);
  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;

  for (let k = 0; k < x.length; k += 16) {
    const aa = a, bb = b, cc = c, dd = d;
    a = ff(a, b, c, d, x[k + 0], 7, 0xd76aa478);
    d = ff(d, a, b, c, x[k + 1], 12, 0xe8c7b756);
    c = ff(c, d, a, b, x[k + 2], 17, 0x242070db);
    b = ff(b, c, d, a, x[k + 3], 22, 0xc1bdceee);
    a = ff(a, b, c, d, x[k + 4], 7, 0xf57c0faf);
    d = ff(d, a, b, c, x[k + 5], 12, 0x4787c62a);
    c = ff(c, d, a, b, x[k + 6], 17, 0xa8304613);
    b = ff(b, c, d, a, x[k + 7], 22, 0xfd469501);
    a = ff(a, b, c, d, x[k + 8], 7, 0x698098d8);
    d = ff(d, a, b, c, x[k + 9], 12, 0x8b44f7af);
    c = ff(c, d, a, b, x[k + 10], 17, 0xffff5bb1);
    b = ff(b, c, d, a, x[k + 11], 22, 0x895cd7be);
    a = ff(a, b, c, d, x[k + 12], 7, 0x6b901122);
    d = ff(d, a, b, c, x[k + 13], 12, 0xfd987193);
    c = ff(c, d, a, b, x[k + 14], 17, 0xa679438e);
    b = ff(b, c, d, a, x[k + 15], 22, 0x49b40821);
    a = gg(a, b, c, d, x[k + 1], 5, 0xf61e2562);
    d = gg(d, a, b, c, x[k + 6], 9, 0xc040b340);
    c = gg(c, d, a, b, x[k + 11], 14, 0x265e5a51);
    b = gg(b, c, d, a, x[k + 0], 20, 0xe9b6c7aa);
    a = gg(a, b, c, d, x[k + 5], 5, 0xd62f105d);
    d = gg(d, a, b, c, x[k + 10], 9, 0x02441453);
    c = gg(c, d, a, b, x[k + 15], 14, 0xd8a1e681);
    b = gg(b, c, d, a, x[k + 4], 20, 0xe7d3fbc8);
    a = gg(a, b, c, d, x[k + 9], 5, 0x21e1cde6);
    d = gg(d, a, b, c, x[k + 14], 9, 0xc33707d6);
    c = gg(c, d, a, b, x[k + 3], 14, 0xf4d50d87);
    b = gg(b, c, d, a, x[k + 8], 20, 0x455a14ed);
    a = gg(a, b, c, d, x[k + 13], 5, 0xa9e3e905);
    d = gg(d, a, b, c, x[k + 2], 9, 0xfcefa3f8);
    c = gg(c, d, a, b, x[k + 7], 14, 0x676f02d9);
    b = gg(b, c, d, a, x[k + 12], 20, 0x8d2a4c8a);
    a = hh(a, b, c, d, x[k + 5], 4, 0xfffa3942);
    d = hh(d, a, b, c, x[k + 8], 11, 0x8771f681);
    c = hh(c, d, a, b, x[k + 11], 16, 0x6d9d6122);
    b = hh(b, c, d, a, x[k + 14], 23, 0xfde5380c);
    a = hh(a, b, c, d, x[k + 1], 4, 0xa4beea44);
    d = hh(d, a, b, c, x[k + 4], 11, 0x4bdecfa9);
    c = hh(c, d, a, b, x[k + 7], 16, 0xf6bb4b60);
    b = hh(b, c, d, a, x[k + 10], 23, 0xbebfbc70);
    a = hh(a, b, c, d, x[k + 13], 4, 0x289b7ec6);
    d = hh(d, a, b, c, x[k + 0], 11, 0xeaa127fa);
    c = hh(c, d, a, b, x[k + 3], 16, 0xd4ef3085);
    b = hh(b, c, d, a, x[k + 6], 23, 0x04881d05);
    a = hh(a, b, c, d, x[k + 9], 4, 0xd9d4d039);
    d = hh(d, a, b, c, x[k + 12], 11, 0xe6db99e5);
    c = hh(c, d, a, b, x[k + 15], 16, 0x1fa27cf8);
    b = hh(b, c, d, a, x[k + 2], 23, 0xc4ac5665);
    a = ii(a, b, c, d, x[k + 0], 6, 0xf4292244);
    d = ii(d, a, b, c, x[k + 7], 10, 0x432aff97);
    c = ii(c, d, a, b, x[k + 14], 15, 0xab9423a7);
    b = ii(b, c, d, a, x[k + 5], 21, 0xfc93a039);
    a = ii(a, b, c, d, x[k + 12], 6, 0x655b59c3);
    d = ii(d, a, b, c, x[k + 3], 10, 0x8f0ccc92);
    c = ii(c, d, a, b, x[k + 10], 15, 0xffeff47d);
    b = ii(b, c, d, a, x[k + 1], 21, 0x85845dd1);
    a = ii(a, b, c, d, x[k + 8], 6, 0x6fa87e4f);
    d = ii(d, a, b, c, x[k + 15], 10, 0xfe2ce6e0);
    c = ii(c, d, a, b, x[k + 6], 15, 0xa3014314);
    b = ii(b, c, d, a, x[k + 13], 21, 0x4e0811a1);
    a = ii(a, b, c, d, x[k + 4], 6, 0xf7537e82);
    d = ii(d, a, b, c, x[k + 11], 10, 0xbd3af235);
    c = ii(c, d, a, b, x[k + 2], 15, 0x2ad7d2bb);
    b = ii(b, c, d, a, x[k + 9], 21, 0xeb86d391);
    a = addUnsigned(a, aa);
    b = addUnsigned(b, bb);
    c = addUnsigned(c, cc);
    d = addUnsigned(d, dd);
  }

  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

function escapeHtml(s: string): string {
  return s.replace(/[<>&"]/g, c =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" } as any)[c]
  );
}

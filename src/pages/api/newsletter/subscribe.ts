// src/pages/api/newsletter/subscribe.ts
// Mailchimp newsletter feliratkozás — server-side proxy
//
// Env vars szükségesek (Cloudflare Pages → Settings → Environment Variables):
//   MAILCHIMP_API_KEY      — Mailchimp API kulcs (formátum: xxx-usX)
//   MAILCHIMP_AUDIENCE_ID  — célközönség ID
//   MAILCHIMP_SERVER       — adatközpont prefix (pl. "us21")
//
// Tagek:
//   - "website-signup"     — minden feliratkozó automatikusan kap (forrás-jelölő)
//   - "registered"         — Sprint 4-ben hozzáadódik amikor a fiók regisztráció
//                            során egyezik az email — összekapcsolja a hírlevél
//                            feliratkozót a regisztrált fiókkal
//   - "vasarlas-YYYY-MM"   — Sprint 3.4-ben automatikusan adódik a checkout után
//
// FONTOS: ne használj "subscriber" vagy "premium" megnevezést — Mónika brand-je
// szerint ez egy szakmai napló, nem előfizetés.

import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;

  let body: { email?: string; source?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Érvénytelen kérés." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Érvénytelen email cím." }, { status: 400 });
  }

  // Forrás-jelölő tag — honnan érkezett a feliratkozás (footer, popup, signup form)
  // Sprint 4-ben hasznos lesz a felhasználói viselkedés elemzéséhez.
  const sourceTag = body.source?.trim() || "website-footer";

  const apiKey = (env as any).MAILCHIMP_API_KEY;
  const audienceId = (env as any).MAILCHIMP_AUDIENCE_ID;
  const server = (env as any).MAILCHIMP_SERVER;

  if (!apiKey || !audienceId || !server) {
    console.error("[newsletter] Mailchimp env vars hiányoznak", {
      hasApiKey: !!apiKey,
      hasAudienceId: !!audienceId,
      hasServer: !!server,
    });
    return Response.json(
      { error: "A havi napló szolgáltatás jelenleg nem érhető el." },
      { status: 503 }
    );
  }

  // ── Mailchimp API hívás ─────────────────────────────────────────────────
  // status: "pending" = double opt-in (megerősítő emailt kap)
  try {
    const url = `https://${server}.api.mailchimp.com/3.0/lists/${audienceId}/members`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`anystring:${apiKey}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: email,
        status: "pending",
        tags: ["website-signup", sourceTag],
      }),
    });

    const data: any = await res.json();

    // ── Sikeres feliratkozás (200/201) ────────────────────────────────────
    if (res.ok) {
      console.log("[newsletter] subscribed:", { email, status: data.status });
      return Response.json({
        success: true,
        message: "A megerősítő emailt elküldtük. Köszönjük!",
      });
    }

    // ── Hibák specifikus kezelése ─────────────────────────────────────────
    // Konkrétan a "Member Exists" eset (csak ezt kezeljük sikeresként)
    if (data.title === "Member Exists") {
      console.log("[newsletter] member exists:", email);
      return Response.json({
        success: true,
        message: "Már megkapod a havi naplót — köszönjük!",
      });
    }

    // Compliance state — a tag korábban leiratkozott vagy elutasította
    if (
      data.title === "Forgotten Email Not Subscribed" ||
      (data.detail && data.detail.includes("compliance"))
    ) {
      console.warn("[newsletter] compliance issue:", { email, detail: data.detail });
      return Response.json({
        success: true,
        message: "Köszönjük! Hamarosan jelentkezünk.",
      });
    }

    // ── Egyéb hibák — részletes naplózás (CF Functions log) ───────────────
    console.error("[newsletter] Mailchimp HTTP error:", {
      status: res.status,
      title: data.title,
      detail: data.detail,
      type: data.type,
      instance: data.instance,
      errors: data.errors,
    });

    // 401 — API kulcs hibás
    if (res.status === 401) {
      return Response.json(
        { error: "Hitelesítési hiba. Kérlek, írj nekünk emailben." },
        { status: 500 }
      );
    }

    // 404 — Audience ID hibás
    if (res.status === 404) {
      return Response.json(
        { error: "Konfigurációs hiba. Kérlek, írj nekünk emailben." },
        { status: 500 }
      );
    }

    // Egyéb (400, 422, 500...)
    return Response.json(
      { error: "Hiba történt. Próbáld újra később!" },
      { status: 500 }
    );
  } catch (err) {
    console.error("[newsletter] unexpected error:", err);
    return Response.json(
      { error: "Hiba történt. Próbáld újra később!" },
      { status: 500 }
    );
  }
};

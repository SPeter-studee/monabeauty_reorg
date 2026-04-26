// src/pages/api/contact.ts
// Kapcsolat form Resend API-n keresztül küld emailt
//
// Env vars:
//   RESEND_API_KEY — Resend API kulcs
//
// Email mona@monastudio.hu címre érkezik

import type { APIRoute } from "astro";

interface ContactPayload {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  consent?: boolean;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]!));
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  const env = locals.runtime.env;

  let body: ContactPayload;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Érvénytelen kérés." }, { status: 400 });
  }

  // ── Validáció ──────────────────────────────────────────────────────────────
  if (!body.name || body.name.trim().length < 2) {
    return Response.json({ error: "Adj meg egy érvényes nevet." }, { status: 400 });
  }
  if (!body.email || !isValidEmail(body.email)) {
    return Response.json({ error: "Érvénytelen email cím." }, { status: 400 });
  }
  if (!body.subject || body.subject.length < 2) {
    return Response.json({ error: "Válassz egy témát." }, { status: 400 });
  }
  if (!body.message || body.message.trim().length < 10) {
    return Response.json({ error: "Az üzenet legalább 10 karakter legyen." }, { status: 400 });
  }
  if (!body.consent) {
    return Response.json({ error: "Az adatkezelési tájékoztató elfogadása kötelező." }, { status: 400 });
  }

  // ── Spam / rate limit (egyszerű) ───────────────────────────────────────────
  // Ugyanattól az IP-től max 5 üzenet / óra
  if (env.CONTENT) {
    const rateKey = `contact-rate-${clientAddress}`;
    try {
      const count = parseInt((await env.CONTENT.get(rateKey)) ?? "0", 10);
      if (count >= 5) {
        return Response.json(
          { error: "Túl sok kérés. Próbáld újra később." },
          { status: 429 }
        );
      }
      await env.CONTENT.put(rateKey, String(count + 1), { expirationTtl: 3600 });
    } catch {
      // KV hiba nem akadályozza meg a küldést
    }
  }

  // ── Resend hívás ──────────────────────────────────────────────────────────
  const apiKey = (env as any).RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY hiányzik");
    return Response.json(
      { error: "Az email szolgáltatás jelenleg nem érhető el." },
      { status: 503 }
    );
  }

  const safeName = escapeHtml(body.name);
  const safeEmail = escapeHtml(body.email);
  const safePhone = body.phone ? escapeHtml(body.phone) : "";
  const safeSubject = escapeHtml(body.subject);
  const safeMessage = escapeHtml(body.message);

  const html = `
    <h2>Új üzenet a Mona Studio weblapról</h2>
    <p><strong>Név:</strong> ${safeName}</p>
    <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
    ${safePhone ? `<p><strong>Telefon:</strong> ${safePhone}</p>` : ""}
    <p><strong>Téma:</strong> ${safeSubject}</p>
    <hr>
    <p><strong>Üzenet:</strong></p>
    <p style="white-space: pre-wrap;">${safeMessage}</p>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Mona Studio <weblap@monastudio.hu>",
        to: ["mona@monastudio.hu"],
        reply_to: body.email,
        subject: `[Weblap] ${body.subject} — ${body.name}`,
        html,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("Resend error:", data);
      throw new Error("Email küldés sikertelen");
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return Response.json(
      { error: "Hiba történt. Próbáld újra később, vagy hívj a +36 20 913 0126 számon!" },
      { status: 500 }
    );
  }
};

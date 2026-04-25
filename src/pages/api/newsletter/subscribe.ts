// src/pages/api/newsletter/subscribe.ts
// Mailchimp newsletter feliratkozás — server-side proxy
//
// Env vars szükségesek (Cloudflare Pages → Settings → Environment Variables):
//   MAILCHIMP_API_KEY      — Mailchimp API kulcs (formátum: xxx-usX)
//   MAILCHIMP_AUDIENCE_ID  — célközönség ID
//   MAILCHIMP_SERVER       — adatközpont prefix (pl. "us21")

import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Érvénytelen kérés." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Érvénytelen email cím." }, { status: 400 });
  }

  const apiKey = (env as any).MAILCHIMP_API_KEY;
  const audienceId = (env as any).MAILCHIMP_AUDIENCE_ID;
  const server = (env as any).MAILCHIMP_SERVER;

  if (!apiKey || !audienceId || !server) {
    console.error("Mailchimp env vars hiányoznak");
    return Response.json(
      { error: "A hírlevél szolgáltatás jelenleg nem érhető el." },
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
        "Authorization": `Basic ${btoa(`anystring:${apiKey}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: email,
        status: "pending",
        tags: ["website-signup"],
      }),
    });

    const data = await res.json();

    // Már feliratkozott
    if (data.title === "Member Exists" || data.status === 400) {
      return Response.json({
        success: true,
        message: "Már fel vagy iratkozva — köszönjük!",
      });
    }

    if (!res.ok) {
      console.error("Mailchimp error:", data);
      throw new Error("Mailchimp hiba");
    }

    return Response.json({
      success: true,
      message: "A megerősítő emailt elküldtük.",
    });
  } catch (err) {
    console.error("Newsletter error:", err);
    return Response.json(
      { error: "Hiba történt. Próbáld újra később!" },
      { status: 500 }
    );
  }
};

/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

// ── Build-time env változók (Vite define) ─────────────────────────────────────
interface ImportMetaEnv {
  readonly PUBLIC_APP_VERSION: string;  // pl. "0.5.1"
  readonly PUBLIC_BUILD_DATE: string;   // pl. "2026-04-26"
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// ── Cloudflare bindings + env vars (runtime) ──────────────────────────────────
interface Env {
  // Bindings
  DB: D1Database;
  CONTENT: KVNamespace;
  PRODUCT_IMAGES: R2Bucket;

  // Env vars / Secrets
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  FACEBOOK_APP_ID: string;          // Sprint 4 — FB Login
  FACEBOOK_APP_SECRET: string;      // Sprint 4 — FB Login
  RESEND_API_KEY: string;
  MAILCHIMP_API_KEY: string;
  MAILCHIMP_AUDIENCE_ID: string;
  MAILCHIMP_SERVER: string;
  FOXPOST_USERNAME: string;
  FOXPOST_PASSWORD: string;
  FOXPOST_API_KEY: string;
  SETMORE_REFRESH_TOKEN: string;
  ANTHROPIC_API_KEY: string;
  DEEPL_API_KEY: string;
}

declare namespace App {
  interface Locals extends Runtime {
    customer?: {
      id: number;
      email: string;
      name: string;
      isAdmin: boolean;
    };
  }
}

/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

interface Env {
  // Bindings
  DB: D1Database;
  CONTENT: KVNamespace;
  PRODUCT_IMAGES: R2Bucket;

  // Env vars / Secrets
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  RESEND_API_KEY: string;
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

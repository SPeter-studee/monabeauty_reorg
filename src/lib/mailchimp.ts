// src/lib/mailchimp.ts
// Sprint 4 — Mailchimp integration helpers (közös library)
//
// Megjegyzés: korábban (Sprint 3.4) az MD5 + tag-elés inline volt a
// /api/checkout/index.ts-ben. Sprint 4-ben kiszerveztük ide, mert a register
// flow is használja (newsletter member detection + "registered" tag).
//
// Tag struktúra (a docs/08-sprint-log.md alapján):
//   - website-signup       — alapszintű (minden feliratkozónak)
//   - website-footer / popup-modal / signup-form — forrás-jelölő
//   - registered           — Sprint 4-ben aktív, regisztrált fiókhoz tartozó email
//   - vasarlas-YYYY-MM     — Sprint 3.4-ben adódik a checkout után (havi szegmens)
//   - vasarolt-<slug>      — termék-specifikus retargeting
// ─────────────────────────────────────────────────────────────────────────────

export interface MailchimpEnv {
  MAILCHIMP_API_KEY?: string;
  MAILCHIMP_AUDIENCE_ID?: string;
  MAILCHIMP_SERVER?: string;
}

export interface MailchimpMember {
  id: string;
  email_address: string;
  status: "subscribed" | "unsubscribed" | "cleaned" | "pending" | "transactional";
  tags: Array<{ id: number; name: string }>;
  merge_fields?: Record<string, unknown>;
}

export type MailchimpLookupResult =
  | { found: true; member: MailchimpMember }
  | { found: false; reason: "not_in_list" | "config_missing" | "api_error" };

// ─────────────────────────────────────────────────────────────────────────────
// 1. MEMBER LOOKUP — van-e az email a listán?
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Megnézi hogy az email létezik-e a Mailchimp audience-ban.
 * Visszaadja a member objektumot tagek-kel együtt.
 *
 * Használat:
 *   - Sprint 3.4: checkout után — ha a vendég már a listán van, tag-eljük
 *   - Sprint 4: register után — ha a regiszt. email már a listán van,
 *     "registered" tag + is_newsletter_member flag a customers táblában
 */
export async function lookupMailchimpMember(
  env: MailchimpEnv,
  email: string
): Promise<MailchimpLookupResult> {
  const { MAILCHIMP_API_KEY: apiKey, MAILCHIMP_AUDIENCE_ID: audienceId, MAILCHIMP_SERVER: server } = env;

  if (!apiKey || !audienceId || !server) {
    return { found: false, reason: "config_missing" };
  }

  try {
    const memberHash = await md5(email.toLowerCase());
    const res = await fetch(
      `https://${server}.api.mailchimp.com/3.0/lists/${audienceId}/members/${memberHash}`,
      {
        headers: {
          Authorization: `Basic ${btoa(`anystring:${apiKey}`)}`,
        },
      }
    );

    if (res.status === 404) {
      return { found: false, reason: "not_in_list" };
    }

    if (!res.ok) {
      console.error(`[mailchimp] Member lookup failed: ${res.status}`);
      return { found: false, reason: "api_error" };
    }

    const member = await res.json() as MailchimpMember;
    return { found: true, member };
  } catch (err) {
    console.error("[mailchimp] lookupMember error:", err);
    return { found: false, reason: "api_error" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. TAG HOZZÁADÁS — meglévő member-hez
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tagek hozzáadása egy meglévő Mailchimp member-hez.
 * NEM hoz létre új feliratkozást — ha a member nem létezik, csendben kihagyja.
 *
 * @param tags — string array. Mindegyik 'active' státusszal kerül hozzáadásra.
 */
export async function addTagsToMember(
  env: MailchimpEnv,
  email: string,
  tags: string[]
): Promise<{ success: boolean; added?: string[]; reason?: string }> {
  const { MAILCHIMP_API_KEY: apiKey, MAILCHIMP_AUDIENCE_ID: audienceId, MAILCHIMP_SERVER: server } = env;

  if (!apiKey || !audienceId || !server) {
    console.warn("[mailchimp] env vars hiányoznak — tag-elés kihagyva");
    return { success: false, reason: "config_missing" };
  }

  if (tags.length === 0) {
    return { success: true, added: [] };
  }

  try {
    const memberHash = await md5(email.toLowerCase());

    // Ellenőrzés — létezik-e a member?
    const lookup = await lookupMailchimpMember(env, email);
    if (!lookup.found) {
      console.log(`[mailchimp] ${email} not in list — skipping tags (${tags.join(", ")})`);
      return { success: false, reason: lookup.reason };
    }

    const tagsToAdd = tags.map(name => ({ name, status: "active" as const }));
    const res = await fetch(
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

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error(`[mailchimp] addTagsToMember failed:`, data);
      return { success: false, reason: "api_error" };
    }

    console.log(`[mailchimp] Tags added for ${email}: ${tags.join(", ")}`);
    return { success: true, added: tags };
  } catch (err) {
    console.error("[mailchimp] addTagsToMember error:", err);
    return { success: false, reason: "exception" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SPRINT 4 — REGISTRATION BRIDGE
// ─────────────────────────────────────────────────────────────────────────────

export interface RegistrationBridgeResult {
  isExistingMember: boolean;       // a regiszt. előtt már a listán volt?
  taggedAsRegistered: boolean;     // sikeresen "registered" tag-elve?
  source: "mailchimp_existing" | "new_registration";
}

/**
 * A regisztráció flow-ban használjuk: ha a vendég email-je már fel van iratkozva
 * a Mailchimp havi naplóra, akkor:
 *   1. customers.is_newsletter_member = 1
 *   2. customers.newsletter_joined_at = now()
 *   3. "registered" tag hozzáadás a Mailchimp member-hez
 *
 * Eredménye alapján a register API jutalmazhatja a vendéget (pl. első rendelés -10%).
 */
export async function bridgeRegistrationToMailchimp(
  env: MailchimpEnv,
  email: string
): Promise<RegistrationBridgeResult> {
  const lookup = await lookupMailchimpMember(env, email);

  if (!lookup.found) {
    return {
      isExistingMember: false,
      taggedAsRegistered: false,
      source: "new_registration",
    };
  }

  // Member létezik — "registered" tag hozzáadás
  const tagResult = await addTagsToMember(env, email, ["registered"]);

  return {
    isExistingMember: true,
    taggedAsRegistered: tagResult.success,
    source: "mailchimp_existing",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SPRINT 3.4 — CHECKOUT TAG-ELÉS (refaktorált helper)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A checkout (Sprint 3.4) után használja:
 *   - vasarlas-YYYY-MM (havi szegmentáció)
 *   - vasarolt-<slug> (termék-specifikus retargeting)
 */
export async function tagPurchase(
  env: MailchimpEnv,
  email: string,
  productSlugs: string[]
): Promise<void> {
  const yearMonth = new Date().toISOString().slice(0, 7); // "2026-04"
  const tags = [
    `vasarlas-${yearMonth}`,
    ...productSlugs.map(slug => `vasarolt-${slug}`),
  ];
  await addTagsToMember(env, email, tags);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. MD5 HASH — Mailchimp member lookup-hoz
// ─────────────────────────────────────────────────────────────────────────────

/**
 * MD5 hash — a Mailchimp /members/{member_hash} endpoint a lowercase MD5-öt várja.
 *
 * **Megjegyzés**: a Web Crypto API NEM támogatja az MD5-öt (kifejezetten kihagyva
 * a biztonságra fókuszáló design miatt — az MD5 cryptographically broken).
 * De a Mailchimp ID-rendszerként használja, nem biztonsági célból, ezért OK.
 */
export async function md5(input: string): Promise<string> {
  return md5Sync(input);
}

/**
 * Tiszta TypeScript MD5 implementáció — RFC 1321 alapján.
 * Cloudflare Workers kompatibilis (nincs Node API, nincs WASM).
 */
function md5Sync(str: string): string {
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
  function convertToWordArray(s: string): number[] {
    const wordArray: number[] = [];
    const bytes = new TextEncoder().encode(s);
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

  const x = convertToWordArray(str.toLowerCase());
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

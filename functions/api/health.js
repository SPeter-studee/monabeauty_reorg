/**
 * GET /api/health — deploy + binding ellenőrzés
 */
export async function onRequestGet({ env }) {
  const bindings = {
    hasDb: Boolean(env && env.DB),
    hasContentKv: Boolean(env && env.CONTENT),
    hasRateLimitKv: Boolean(env && env.CHAT_RATE_LIMIT),
  };
  return Response.json({
    ok: true,
    project: "monabeauty2",
    bindings,
    ts: new Date().toISOString(),
  });
}

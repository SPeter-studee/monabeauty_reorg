/**
 * GET /api/health — deploy / binding smoke test
 */
export async function onRequestGet() {
  return Response.json({
    ok: true,
    project: "monabeauty_reorg",
    ts: new Date().toISOString(),
  });
}

// scripts/generate-webp.mjs
//
// Rekurzívan bejárja a `public/` mappát, minden .jpg / .jpeg / .png mellé
// ír egy azonos nevű .webp változatot, ha még nincs vagy a forrás újabb.
//
// Használat:
//   npm run images:webp
//
// Skip:
//   - Ha a .webp már létezik és újabb mint a forrás
//   - Ha az eredeti fájl 200 KB-nál kisebb és <100×100 px (pl. favicon: nem éri meg)

import { readdir, stat, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "public");

const RASTER_EXT = new Set([".jpg", ".jpeg", ".png"]);

const QUALITY_BY_EXT = {
  ".jpg": 78,
  ".jpeg": 78,
  ".png": 80,
};

let stats = { converted: 0, skipped: 0, failed: 0, totalSavedBytes: 0 };

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

async function shouldConvert(srcPath, webpPath) {
  if (!existsSync(webpPath)) return true;
  const [src, webp] = await Promise.all([stat(srcPath), stat(webpPath)]);
  return src.mtimeMs > webp.mtimeMs;
}

async function convert(srcPath) {
  const ext = extname(srcPath).toLowerCase();
  if (!RASTER_EXT.has(ext)) return;

  const webpPath = srcPath.slice(0, -ext.length) + ".webp";

  if (!(await shouldConvert(srcPath, webpPath))) {
    stats.skipped++;
    return;
  }

  try {
    const quality = QUALITY_BY_EXT[ext] ?? 80;
    const srcSize = (await stat(srcPath)).size;

    await sharp(srcPath)
      .webp({ quality, effort: 5 })
      .toFile(webpPath);

    const webpSize = (await stat(webpPath)).size;
    const saved = srcSize - webpSize;
    stats.totalSavedBytes += saved;
    stats.converted++;

    const rel = srcPath.replace(ROOT + "/", "");
    const pct = ((saved / srcSize) * 100).toFixed(0);
    console.log(`✓ ${rel} → .webp  (${formatBytes(srcSize)} → ${formatBytes(webpSize)}, −${pct}%)`);
  } catch (err) {
    stats.failed++;
    console.error(`✗ ${srcPath}: ${err.message}`);
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ── Run ─────────────────────────────────────────────────────────────────
console.log(`\n→ WebP generálás: ${ROOT}\n`);

if (!existsSync(ROOT)) {
  console.error(`Hiba: a public/ mappa nem létezik (${ROOT})`);
  process.exit(1);
}

for await (const filePath of walk(ROOT)) {
  await convert(filePath);
}

console.log(`\nKész:`);
console.log(`  Konvertálva : ${stats.converted}`);
console.log(`  Kihagyva    : ${stats.skipped}`);
console.log(`  Sikertelen  : ${stats.failed}`);
if (stats.totalSavedBytes > 0) {
  console.log(`  Megtakarítás: ${formatBytes(stats.totalSavedBytes)}`);
}
console.log("");

// Egyszeri: régi projekt wrangler kontextusából KV site_content lekérése, UTF-8 mentés
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "data", "migration");
const outFile = join(outDir, "site_content.json");
const legacyRoot = join(root, "..", "monabeuty");

mkdirSync(outDir, { recursive: true });

const buf = execSync(
  'npx wrangler kv key get --binding=CONTENT --remote "site_content" --text',
  {
    cwd: legacyRoot,
    maxBuffer: 50 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  }
);

const text = buf.toString("utf8");
if (text.includes("401") && text.includes("Unauthorized")) {
  console.error("KV 401 — futtasd: cd ..\\monabeuty && npx wrangler login");
  process.exit(1);
}
writeFileSync(outFile, text, "utf8");
console.log("OK", outFile, text.length, "chars");

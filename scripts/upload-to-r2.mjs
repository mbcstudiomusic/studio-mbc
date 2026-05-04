/**
 * upload-to-r2.mjs
 * Uploade les fichiers WAV/MP3/PNG d'un album vers Cloudflare R2.
 *
 * Usage :
 *   node scripts/upload-to-r2.mjs "/chemin/absolu/ALBUM"
 *   node scripts/upload-to-r2.mjs --album "WHISPERING ARPEGGIOS"  (utilise CATALOG_ROOT)
 *
 * Clés R2 : ALBUM_NAME/filename.ext  (ex: WHISPERING ARPEGGIOS/BLURRY DAYS.wav)
 * Skippé si le fichier existe déjà avec la même taille.
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, readdirSync, statSync, realpathSync } from "fs";
import { join, basename, extname } from "path";
import { fileURLToPath } from "url";

// ── Chargement .env.local ─────────────────────────────────────────────────────

function loadEnv() {
  const envPath = new URL("../.env.local", import.meta.url).pathname;
  try {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 0) continue;
      const key = t.slice(0, eq).trim();
      const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {}
}
loadEnv();

// ── Config ────────────────────────────────────────────────────────────────────

const UPLOAD_EXTS = new Set([".wav", ".mp3", ".png"]);
const MIME = { ".wav": "audio/wav", ".mp3": "audio/mpeg", ".png": "image/png" };

function fmt(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 ** 2).toFixed(1)} MB`;
}

// ── Arguments ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let albumPath;

if (args[0] === "--album") {
  const name = args[1];
  if (!name) { console.error("❌  --album requiert un nom d'album."); process.exit(1); }
  const root = process.env.CATALOG_ROOT;
  if (!root) {
    console.error("❌  CATALOG_ROOT non défini dans .env.local.");
    process.exit(1);
  }
  albumPath = join(root, name);
} else if (args[0]) {
  albumPath = args[0];
} else {
  console.error(
    'Usage: node scripts/upload-to-r2.mjs "/chemin/ALBUM"\n' +
    '       node scripts/upload-to-r2.mjs --album "ALBUM NAME"'
  );
  process.exit(1);
}

// ── Validation ────────────────────────────────────────────────────────────────

const { R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;
if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error(
    "❌  Variables R2 manquantes dans .env.local :\n" +
    "    R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME"
  );
  process.exit(1);
}

try {
  if (!statSync(albumPath).isDirectory()) throw new Error();
} catch {
  console.error(`❌  Dossier introuvable : ${albumPath}`);
  process.exit(1);
}

// albumName = nom passé en argument (ou basename du chemin) → utilisé comme préfixe R2
// Il doit correspondre au nom Supabase (généralement UPPERCASE issu du CSV)
const albumName = basename(albumPath);
// Résoudre le vrai chemin disque pour lire les fichiers (macOS est insensible à la casse)
const realAlbumPath = (() => { try { return realpathSync(albumPath); } catch { return albumPath; } })();
const files = readdirSync(realAlbumPath)
  .filter(f => UPLOAD_EXTS.has(extname(f).toLowerCase()))
  .sort();

if (files.length === 0) {
  console.log(`ℹ  Aucun fichier WAV/MP3/PNG dans ${albumPath}`);
  process.exit(0);
}

// ── Client R2 ─────────────────────────────────────────────────────────────────

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

// ── Upload ────────────────────────────────────────────────────────────────────

const W = 60;
console.log(`\n${"═".repeat(W)}`);
console.log(`  Upload R2 — ${albumName}  (${files.length} fichier(s))`);
console.log(`${"═".repeat(W)}\n`);

let done = 0, skipped = 0, failed = 0;
const errors = [];

for (const file of files) {
  const filePath = join(realAlbumPath, file);
  const key      = `${albumName}/${file}`;
  const ext      = extname(file).toLowerCase();
  const size     = statSync(filePath).size;
  const label    = `${file} (${fmt(size)})`;

  process.stdout.write(`  ⟳  ${label.padEnd(60)} `);

  // Skip si taille identique (contrôle rapide)
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
    if (head.ContentLength === size) {
      process.stdout.write("déjà présent\n");
      skipped++;
      continue;
    }
  } catch (e) {
    // 404 = pas encore uploadé → on continue
    if (e.$metadata?.httpStatusCode !== 404 && e.name !== "NotFound") {
      // Erreur inattendue sur HEAD : on tente quand même l'upload
    }
  }

  try {
    await s3.send(new PutObjectCommand({
      Bucket:      R2_BUCKET_NAME,
      Key:         key,
      Body:        readFileSync(filePath),
      ContentType: MIME[ext] ?? "application/octet-stream",
    }));
    process.stdout.write("✓\n");
    done++;
  } catch (err) {
    process.stdout.write(`✗ ${err.message}\n`);
    errors.push({ file, error: err.message });
    failed++;
  }
}

console.log(`\n${"─".repeat(W)}`);
console.log(`  ✅  Uploadés  : ${done}`);
console.log(`  ⏭   Skippés   : ${skipped}`);
if (failed > 0) {
  console.log(`  ❌  Erreurs   : ${failed}`);
  for (const { file, error } of errors) console.log(`     ${file} → ${error}`);
  console.log(`${"─".repeat(W)}\n`);
  process.exit(1);
}
console.log(`${"─".repeat(W)}\n`);

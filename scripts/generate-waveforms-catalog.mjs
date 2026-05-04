/**
 * generate-waveforms-catalog.mjs
 * Calcule les waveforms RMS pour les tracks du catalogue MBC et les stocke dans Supabase.
 *
 * Prérequis — migration Supabase (à exécuter une seule fois) :
 *   ALTER TABLE tracks ADD COLUMN IF NOT EXISTS waveform_data jsonb;
 *
 * Usage :
 *   node scripts/generate-waveforms-catalog.mjs "WHISPERING ARPEGGIOS"
 *   node scripts/generate-waveforms-catalog.mjs          ← tous les tracks sans waveform
 *
 * Algorithme :
 *   1. Télécharge le WAV depuis R2 (préfère le variant (Main), sinon premier match)
 *   2. Convertit en PCM 16-bit mono 44100 Hz via afconvert
 *   3. Calcule 200 fenêtres RMS
 *   4. Normalise par le 95e percentile
 *   5. Stocke { bars, duration } dans tracks.waveform_data
 */

import { S3Client, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { createClient }    from "@supabase/supabase-js";
import { execSync }        from "child_process";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { basename, extname } from "path";
import { Readable }        from "stream";
import { pipeline }        from "stream/promises";
import { createWriteStream } from "fs";
import os   from "os";
import path from "path";

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

// ── Validation env ────────────────────────────────────────────────────────────

const { R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME,
        SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

const missing = ["R2_ENDPOINT","R2_ACCESS_KEY_ID","R2_SECRET_ACCESS_KEY","R2_BUCKET_NAME",
                 "SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY"]
  .filter(k => !process.env[k]);

if (missing.length) {
  console.error(`❌  Variables manquantes dans .env.local : ${missing.join(", ")}`);
  process.exit(1);
}

// Vérification afconvert (macOS)
try {
  execSync("which afconvert", { stdio: "pipe" });
} catch {
  console.error("❌  afconvert introuvable — macOS requis pour la génération de waveforms.");
  process.exit(1);
}

// ── Config ────────────────────────────────────────────────────────────────────

const BAR_COUNT   = 200;
const BATCH_SIZE  = 10;
const AUDIO_EXTS  = new Set([".wav", ".mp3", ".aiff"]);

// ── Clients ───────────────────────────────────────────────────────────────────

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Helpers ───────────────────────────────────────────────────────────────────

async function listR2Album(albumName) {
  const keys = [];
  let token;
  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket:            R2_BUCKET_NAME,
      Prefix:            `${albumName}/`,
      ContinuationToken: token,
    }));
    for (const obj of res.Contents ?? []) {
      if (AUDIO_EXTS.has(extname(obj.Key).toLowerCase())) keys.push(obj.Key);
    }
    token = res.NextContinuationToken;
  } while (token);
  return keys;
}

function matchR2Key(r2Keys, albumName, trackTitle) {
  const titleUp = trackTitle.toUpperCase();
  const prefix  = `${albumName}/`;
  const matches = r2Keys.filter(k => {
    const name = basename(k).toUpperCase();
    return name.startsWith(titleUp + " (") ||
           name.startsWith(titleUp + " -") ||
           name.startsWith(titleUp + ".");
  });
  if (!matches.length) return null;
  return matches.find(k => k.includes("(Main)")) ?? matches[0];
}

async function downloadR2(key, destPath) {
  const res = await s3.send(new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
  await pipeline(Readable.from(res.Body), createWriteStream(destPath));
}

function computeWaveform(tmpWav) {
  const buf       = readFileSync(tmpWav);
  const sampleRate = buf.readUInt32LE(24);
  const bitDepth   = buf.readUInt16LE(34);
  const channels   = buf.readUInt16LE(22);

  // Localiser le chunk "data"
  let offset = 12;
  let dataOffset = 44, dataSize = buf.length - 44;
  while (offset < buf.length - 8) {
    const id   = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === "data") { dataOffset = offset + 8; dataSize = size; break; }
    offset += 8 + size + (size % 2);
  }

  const bytesPerSample = bitDepth / 8;
  const totalSamples   = Math.floor(dataSize / (bytesPerSample * channels));
  if (totalSamples === 0) throw new Error("WAV vide ou format non supporté");

  const duration  = totalSamples / sampleRate;
  const blockSize = Math.floor(totalSamples / BAR_COUNT);
  const bars      = [];

  for (let i = 0; i < BAR_COUNT; i++) {
    let sum = 0;
    const sampleOffset = dataOffset + i * blockSize * bytesPerSample * channels;
    for (let j = 0; j < blockSize; j++) {
      const pos = sampleOffset + j * bytesPerSample * channels;
      let sample = 0;
      if (bitDepth === 16) {
        sample = buf.readInt16LE(pos) / 32768;
      } else if (bitDepth === 24) {
        const raw = buf.readUIntLE(pos, 3);
        sample = (raw > 0x7FFFFF ? raw - 0x1000000 : raw) / 8388608;
      } else if (bitDepth === 32) {
        sample = buf.readInt32LE(pos) / 2147483648;
      }
      sum += sample * sample;
    }
    bars.push(Math.sqrt(sum / blockSize));
  }

  // Normalisation par le 95e percentile
  const sorted = [...bars].sort((a, b) => a - b);
  const p95    = sorted[Math.floor(sorted.length * 0.95)] || 0.001;
  const normalized = bars.map(b => parseFloat(Math.min(b / p95, 1).toFixed(4)));

  return { bars: normalized, duration: parseFloat(duration.toFixed(3)) };
}

// ── Requêtes Supabase ─────────────────────────────────────────────────────────

async function fetchTracks(albumArg) {
  if (albumArg) {
    // ilike = insensible à la casse (ex: "Whispering Arpeggios" → trouve "WHISPERING ARPEGGIOS")
    const { data: album, error: ae } = await sb
      .from("albums").select("id, name").ilike("name", albumArg).single();
    if (ae || !album) {
      console.error(`❌  Album "${albumArg}" introuvable dans Supabase.`);
      console.error("    (Avez-vous lancé l'import CSV ?)");
      process.exit(1);
    }
    const { data, error } = await sb
      .from("tracks")
      .select("id, title")
      .eq("album_id", album.id)
      .is("waveform_data", null);
    if (error) throw error;
    // album.name = nom canonique Supabase (ex: "WHISPERING ARPEGGIOS") → utilisé pour les clés R2
    return data.map(t => ({ ...t, albumName: album.name }));
  }

  // Sans argument : tous les tracks avec waveform_data null
  const { data, error } = await sb
    .from("tracks")
    .select("id, title, albums(name)")
    .is("waveform_data", null);
  if (error) throw error;
  return data.map(t => ({ ...t, albumName: t.albums?.name ?? "" }));
}

// ── Main ──────────────────────────────────────────────────────────────────────

const albumArg = process.argv[2] ?? null;

const W = 60;
console.log(`\n${"═".repeat(W)}`);
console.log(`  Waveforms catalogue MBC${albumArg ? ` — ${albumArg}` : " (tous albums)"}`);
console.log(`${"═".repeat(W)}\n`);

const tracks = await fetchTracks(albumArg);

if (tracks.length === 0) {
  console.log("  ✓ Aucun track sans waveform_data.\n");
  process.exit(0);
}

console.log(`  ${tracks.length} track(s) à traiter\n`);

// Cache des listes R2 par album
const r2Cache = new Map();

let ok = 0, ko = 0;

for (let i = 0; i < tracks.length; i += BATCH_SIZE) {
  const batch = tracks.slice(i, i + BATCH_SIZE);
  const batchNum = Math.floor(i / BATCH_SIZE) + 1;
  const batchTotal = Math.ceil(tracks.length / BATCH_SIZE);
  console.log(`  Batch ${batchNum}/${batchTotal}`);

  for (const track of batch) {
    const { id, title, albumName: album } = track;
    const tag = `  [${String(i + batch.indexOf(track) + 1).padStart(3)}/${tracks.length}] ${title}`;
    process.stdout.write(`${tag.padEnd(50)} `);

    const tmpIn  = path.join(os.tmpdir(), `mbc_dl_${Date.now()}.wav`);
    const tmpPcm = path.join(os.tmpdir(), `mbc_pcm_${Date.now()}.wav`);

    try {
      // Trouver la clé R2
      if (!r2Cache.has(album)) r2Cache.set(album, await listR2Album(album));
      const r2Key = matchR2Key(r2Cache.get(album), album, title);
      if (!r2Key) {
        process.stdout.write("⚠  aucun fichier R2 trouvé\n");
        ko++;
        continue;
      }

      // Télécharger
      await downloadR2(r2Key, tmpIn);

      // Convertir en PCM 16-bit mono 44100
      execSync(
        `afconvert "${tmpIn}" "${tmpPcm}" -f WAVE -d LEI16@44100 -c 1`,
        { stdio: "pipe" }
      );

      // Calculer la waveform
      const waveform = computeWaveform(tmpPcm);

      // Mettre à jour Supabase
      const { error } = await sb
        .from("tracks")
        .update({ waveform_data: waveform })
        .eq("id", id);
      if (error) throw error;

      process.stdout.write(`✓  ${waveform.duration.toFixed(1)}s\n`);
      ok++;

    } catch (err) {
      process.stdout.write(`✗  ${err.message}\n`);
      ko++;
    } finally {
      try { if (existsSync(tmpIn))  unlinkSync(tmpIn);  } catch {}
      try { if (existsSync(tmpPcm)) unlinkSync(tmpPcm); } catch {}
    }
  }

  if (i + BATCH_SIZE < tracks.length) console.log();
}

console.log(`\n${"─".repeat(W)}`);
console.log(`  ✅  Générés   : ${ok}`);
if (ko > 0) console.log(`  ❌  Erreurs   : ${ko}`);
console.log(`${"─".repeat(W)}\n`);

if (ko > 0 && ok === 0) process.exit(1);

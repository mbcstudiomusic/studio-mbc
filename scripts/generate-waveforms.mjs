/**
 * generate-waveforms.mjs
 * Génère les fichiers JSON de waveform manquants pour les MP3 dans public/audio/.
 * Utilise afconvert (macOS uniquement). Sur Linux/CI, passe silencieusement.
 *
 * Usage : node scripts/generate-waveforms.mjs
 * Output: public/audio/waveforms/<slug>.json  { bars: number[], duration: number }
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, existsSync } from "fs";
import { join, basename, extname } from "path";
import os from "os";

// Vérifier que afconvert est disponible (macOS uniquement)
try {
  execSync("which afconvert", { stdio: "pipe" });
} catch {
  console.log("ℹ afconvert non disponible (Linux/CI) — waveforms ignorées.");
  process.exit(0);
}

const AUDIO_DIR = join(process.cwd(), "public/audio");
const OUT_DIR   = join(process.cwd(), "public/audio/waveforms");
const BAR_COUNT = 200;

mkdirSync(OUT_DIR, { recursive: true });

// Ne traiter que les MP3 sans JSON existant
const files = readdirSync(AUDIO_DIR)
  .filter(f => f.endsWith(".mp3"))
  .filter(f => !existsSync(join(OUT_DIR, basename(f, extname(f)) + ".json")));

if (files.length === 0) {
  console.log("✓ Toutes les waveforms sont à jour.");
  process.exit(0);
}

for (const file of files) {
  const inputPath = join(AUDIO_DIR, file);
  const slug      = basename(file, extname(file));
  const tmpWav    = join(os.tmpdir(), `waveform_${Date.now()}.wav`);

  console.log(`⟳  ${file}`);

  try {
    execSync(`afconvert "${inputPath}" "${tmpWav}" -f WAVE -d LEI16@44100 -c 1`, { stdio: "pipe" });

    const buf      = readFileSync(tmpWav);
    const samples  = buf.length > 44 ? (buf.length - 44) / 2 : 0;
    if (samples === 0) throw new Error("WAV vide");

    const sampleRate = buf.readUInt32LE(24);
    const duration   = samples / sampleRate;
    const blockSize  = Math.floor(samples / BAR_COUNT);
    const bars       = [];

    for (let i = 0; i < BAR_COUNT; i++) {
      let sum = 0;
      const offset = 44 + i * blockSize * 2;
      for (let j = 0; j < blockSize; j++) {
        const sample = buf.readInt16LE(offset + j * 2) / 32768;
        sum += sample * sample;
      }
      bars.push(Math.sqrt(sum / blockSize));
    }

    const max        = Math.max(...bars, 0.001);
    const normalized = bars.map(b => parseFloat((b / max).toFixed(4)));

    writeFileSync(
      join(OUT_DIR, `${slug}.json`),
      JSON.stringify({ duration: parseFloat(duration.toFixed(3)), bars: normalized })
    );
    console.log(`   ✓ ${duration.toFixed(1)}s`);

  } catch (err) {
    console.error(`   ✗ ${err.message}`);
  } finally {
    try { unlinkSync(tmpWav); } catch {}
  }
}

console.log("\n✓ Waveforms générées.");

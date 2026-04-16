/**
 * generate-waveforms.mjs
 * Génère des fichiers JSON de waveform pour chaque piste audio m4a.
 * Utilise afconvert (macOS) pour décoder en PCM brut, puis calcule les barres.
 *
 * Usage : node scripts/generate-waveforms.mjs
 * Output: public/audio/waveforms/<slug>.json  { bars: number[], duration: number }
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from "fs";
import { join, basename, extname } from "path";
import os from "os";

const AUDIO_DIR = join(process.cwd(), "public/audio");
const OUT_DIR   = join(process.cwd(), "public/audio/waveforms");
const BAR_COUNT = 200;

mkdirSync(OUT_DIR, { recursive: true });

const files = readdirSync(AUDIO_DIR).filter(f => f.endsWith(".mp3"));

for (const file of files) {
  const inputPath = join(AUDIO_DIR, file);
  const slug      = basename(file, extname(file));
  const tmpWav    = join(os.tmpdir(), `waveform_${Date.now()}.wav`);

  console.log(`⟳  ${file}`);

  try {
    // 1. Décoder mp3 → WAV PCM 16-bit mono 44100 Hz via afconvert
    execSync(
      `afconvert "${inputPath}" "${tmpWav}" -f WAVE -d LEI16@44100 -c 1`,
      { stdio: "pipe" }
    );

    // 2. Parser le WAV (header = 44 octets, données PCM 16-bit signé little-endian)
    const buf     = readFileSync(tmpWav);
    const samples = buf.length > 44 ? (buf.length - 44) / 2 : 0;
    if (samples === 0) throw new Error("WAV vide");

    // Durée réelle en secondes
    const sampleRate = buf.readUInt32LE(24);
    const duration   = samples / sampleRate;

    // 3. Calculer les barres RMS
    const blockSize = Math.floor(samples / BAR_COUNT);
    const bars      = [];

    for (let i = 0; i < BAR_COUNT; i++) {
      let sum = 0;
      const offset = 44 + i * blockSize * 2;
      for (let j = 0; j < blockSize; j++) {
        const sample = buf.readInt16LE(offset + j * 2) / 32768;
        sum += sample * sample;
      }
      bars.push(Math.sqrt(sum / blockSize));
    }

    // Normaliser
    const max = Math.max(...bars, 0.001);
    const normalized = bars.map(b => parseFloat((b / max).toFixed(4)));

    // 4. Écrire le JSON
    const outPath = join(OUT_DIR, `${slug}.json`);
    writeFileSync(outPath, JSON.stringify({ duration: parseFloat(duration.toFixed(3)), bars: normalized }));
    console.log(`   ✓ ${duration.toFixed(1)}s  →  ${outPath}`);

  } catch (err) {
    console.error(`   ✗ Erreur : ${err.message}`);
  } finally {
    try { unlinkSync(tmpWav); } catch {}
  }
}

console.log("\n✓ Waveforms générées.");

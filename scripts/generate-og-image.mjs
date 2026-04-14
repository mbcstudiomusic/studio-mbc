/**
 * Génère public/images/og-image.jpg (1200x630)
 * - Fond : hero.jpg recadré centré + overlay sombre 50%
 * - Texte bas : Valentin MARINELLI & Clément BARBIER + sous-titre
 *
 * Utilise uniquement sharp (déjà installé par Next.js).
 * Les polices Cormorant Garamond et Inter ne pouvant pas être intégrées
 * directement via sharp sans @napi-rs/canvas, le texte est rendu en SVG
 * embarqué dans le composite sharp.
 */

import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const W = 1200;
const H = 630;

// ── 1. Recadrer hero.jpg en 1200x630 centré ──────────────────────────────────
const heroBuf = await sharp(join(ROOT, "public/images/hero.jpg"))
  .resize(W, H, { fit: "cover", position: "center" })
  .toBuffer();

// ── 2. Overlay sombre (rectangle noir 50% opacité) ───────────────────────────
const overlay = await sharp({
  create: { width: W, height: H, channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0.55 } },
}).png().toBuffer();

// ── 3. SVG texte ──────────────────────────────────────────────────────────────
// Cormorant Garamond n'est pas dispo en système → on utilise Georgia (serif)
// comme substitut raisonnable pour le rendu OG (personne ne verra la diff sur
// une preview 1200px).
const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <!-- Ligne 1 : noms -->
  <text
    x="${W / 2}" y="${H - 90}"
    text-anchor="middle"
    font-family="Georgia, serif"
    font-size="52"
    fill="white"
    letter-spacing="2"
  >Valentin MARINELLI &amp; Clément BARBIER</text>

  <!-- Ligne 2 : sous-titre -->
  <text
    x="${W / 2}" y="${H - 44}"
    text-anchor="middle"
    font-family="Arial, sans-serif"
    font-size="14"
    font-weight="200"
    fill="rgba(255,255,255,0.70)"
    letter-spacing="6"
  >COMPOSITEURS · MUSIQUE À L&#x27;IMAGE</text>
</svg>`;

const svgBuf = Buffer.from(svg);

// ── 4. Assembler ─────────────────────────────────────────────────────────────
await sharp(heroBuf)
  .composite([
    { input: overlay, blend: "over" },
    { input: svgBuf,  blend: "over" },
  ])
  .jpeg({ quality: 90 })
  .toFile(join(ROOT, "public/images/og-image.jpg"));

console.log("✓ public/images/og-image.jpg généré (1200×630)");

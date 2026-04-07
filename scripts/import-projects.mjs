/**
 * IMPORT PROJETS
 * --------------
 * Ce script lit content/projets.csv et régénère automatiquement src/data/projets.ts
 *
 * UTILISATION :
 *   1. Ouvrez content/projets.csv dans Excel ou Numbers
 *   2. Ajoutez / modifiez vos projets (une ligne = un projet)
 *   3. Sauvegardez en format CSV (séparateur virgule, encodage UTF-8)
 *   4. Dans le terminal, depuis le dossier du projet :
 *        node scripts/import-projects.mjs
 *   5. Relancez le site : npm run dev
 *
 * COLONNES DU CSV :
 *   slug         → identifiant URL unique, sans espaces ni accents (ex: mon-projet)
 *   title        → titre affiché sur le site
 *   year         → année (nombre entier)
 *   type         → catégorie (Fiction, Série, Documentaire, Théâtre, Animation…)
 *   poster carousel → chemin image 16/9 pour le carousel (ex: /images/projects/mon-projet.jpg)
 *   affiche film    → chemin image A4 portrait pour le modal (laisser vide si non disponible)
 *                     → placez les images dans public/images/projects/
 *   synopsis     → description du projet
 *   realisateur  → nom du réalisateur ou metteur en scène (laisser vide si non applicable)
 *   production   → société de production
 *   trailer      → URL complète de la bande-annonce (laisser vide si non disponible)
 *   imdb         → URL complète de la fiche IMDb (laisser vide si non disponible)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.join(__dirname, "../content/projets.csv");
const outputPath = path.join(__dirname, "../src/data/projets.ts");

// ─── Lecture du CSV ───────────────────────────────────────────────────────────

function parseCSV(content) {
  const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const headers = splitCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitCSVLine(line);
    const row = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] || "").trim();
    });
    rows.push(row);
  }

  return rows;
}

function splitCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ";" && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// ─── Génération du fichier TypeScript ────────────────────────────────────────

function escapeTS(str) {
  return str.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
}

function generateTS(projects) {
  const entries = projects
    .map((p) => {
      return `  {
    slug: "${p.slug}",
    title: "${escapeTS(p.title)}",
    year: ${parseInt(p.year) || 0},
    type: "${escapeTS(p.type)}",
    poster: "${p["poster carousel"] || ""}",
    image: "${p["affiche film"] || ""}",
    synopsis: \`${escapeTS(p.synopsis)}\`,
    realisateur: "${escapeTS(p.realisateur || "")}",
    production: "${escapeTS(p.production || "")}",
    trailer: "${p.trailer || ""}",
    imdb: "${p.imdb || ""}",
  }`;
    })
    .join(",\n");

  return `export interface Project {
  slug: string;
  title: string;
  year: number;
  type: string;
  poster: string;       // image 16/9 pour le carousel
  image: string;        // image A4 portrait pour le modal (optionnel)
  synopsis: string;
  realisateur: string;  // réalisateur ou metteur en scène
  production: string;   // société de production
  trailer: string;      // URL bande-annonce (optionnel)
  imdb: string;         // URL IMDb (optionnel)
}

export const projects: Project[] = [
${entries},
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const csv = fs.readFileSync(csvPath, "utf-8");
const projects = parseCSV(csv);

if (projects.length === 0) {
  console.error("❌ Aucun projet trouvé dans le CSV.");
  process.exit(1);
}

const ts = generateTS(projects);
fs.writeFileSync(outputPath, ts, "utf-8");

console.log(`✅ ${projects.length} projets importés → src/data/projets.ts`);
projects.forEach((p, i) => {
  const links = [p.trailer && "trailer", p.imdb && "imdb"].filter(Boolean).join(", ");
  const img = p.image ? " 🖼" : "";
  console.log(`   ${String(i + 1).padStart(2, "0")}. ${p.title} (${p.year}) — ${p.type}${img}${links ? ` [${links}]` : ""}`);
});

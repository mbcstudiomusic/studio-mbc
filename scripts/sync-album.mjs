/**
 * sync-album.mjs — Pipeline complet d'ajout d'album MBC Éditions
 *
 * Usage : node scripts/sync-album.mjs "WHISPERING ARPEGGIOS"
 *         npm run sync "WHISPERING ARPEGGIOS"
 *
 * Étapes :
 *   a) Vérification nomenclature (rename_catalog.py --dry-run)
 *   b) Upload vers R2
 *   c) Import Supabase (import_catalog.py)
 *   d) Génération waveforms
 *   e) git add . && git commit && git push
 *
 * Variables requises dans .env.local :
 *   CATALOG_ROOT  — chemin absolu vers 01.SORTIS
 *   R2_*          — credentials Cloudflare R2
 *   SUPABASE_URL + SUPABASE_SERVICE_KEY
 */

import { spawnSync, execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
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

// ── Argument ──────────────────────────────────────────────────────────────────

const albumName = process.argv[2];
if (!albumName) {
  console.error('Usage: node scripts/sync-album.mjs "NOM DE L\'ALBUM"');
  process.exit(1);
}

const CATALOG_ROOT = process.env.CATALOG_ROOT;
if (!CATALOG_ROOT) {
  console.error("❌  CATALOG_ROOT non défini dans .env.local.");
  process.exit(1);
}

const albumPath = join(CATALOG_ROOT, albumName);
if (!existsSync(albumPath)) {
  console.error(`❌  Dossier album introuvable : ${albumPath}`);
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const W = 64;

function header(stepNum, label) {
  console.log(`\n${"═".repeat(W)}`);
  console.log(`  Étape ${stepNum}/5 — ${label}`);
  console.log(`${"═".repeat(W)}`);
}

function ok(msg)   { console.log(`  ✅  ${msg}`); }
function warn(msg) { console.log(`  ⚠️   ${msg}`); }
function fail(msg) { console.error(`\n  ❌  ${msg}\n`); process.exit(1); }

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, {
    encoding:  "utf8",
    maxBuffer: 10 * 1024 * 1024,
    ...opts,
  });
  return res;
}

// ── Bannière ──────────────────────────────────────────────────────────────────

console.log(`\n${"╔" + "═".repeat(W - 2) + "╗"}`);
console.log(`  SYNC ALBUM : ${albumName}`);
console.log(`${"╚" + "═".repeat(W - 2) + "╝"}`);

// ── Étape a : Vérification nomenclature ──────────────────────────────────────

header("a", "Vérification nomenclature");

const renameScript = join(CATALOG_ROOT, "rename_catalog.py");
if (!existsSync(renameScript)) {
  fail(`rename_catalog.py introuvable : ${renameScript}`);
}

const renameRes = run("python3", [renameScript], {
  input: "non\n",
  cwd:   CATALOG_ROOT,
});

if (renameRes.stdout) process.stdout.write(renameRes.stdout);
if (renameRes.stderr) process.stderr.write(renameRes.stderr);

// Détecter des opérations planifiées pour l'album demandé
const opMatch = renameRes.stdout?.match(/(\d+)\s+opération\(s\)\s+planifiée\(s\)/);
const opCount  = opMatch ? parseInt(opMatch[1], 10) : 0;

if (renameRes.status !== 0) {
  fail("rename_catalog.py a échoué (voir ci-dessus).");
}

if (opCount > 0) {
  console.log();
  fail(
    `${opCount} opération(s) de renommage détectée(s).\n` +
    `  Corrigez d'abord les fichiers avec :\n` +
    `    cd "${CATALOG_ROOT}" && python3 rename_catalog.py`
  );
}

ok("Nomenclature conforme — aucune correction nécessaire.");

// ── Étape b : Upload R2 ───────────────────────────────────────────────────────

header("b", "Upload vers R2");

const uploadScript = new URL("./upload-to-r2.mjs", import.meta.url).pathname;
const uploadRes = run(
  process.execPath,
  [uploadScript, "--album", albumName],
  { stdio: "inherit", env: process.env }
);

if (uploadRes.status !== 0) {
  fail("L'upload R2 a échoué (voir ci-dessus).");
}
ok("Upload R2 terminé.");

// ── Étape c : Import Supabase ─────────────────────────────────────────────────

header("c", "Import Supabase (import_catalog.py)");

const importScript = join(CATALOG_ROOT, "import_catalog.py");
if (!existsSync(importScript)) {
  fail(`import_catalog.py introuvable : ${importScript}`);
}

// import_catalog.py lit SUPABASE_SERVICE_KEY depuis 01.SORTIS/.env
// On propage aussi SUPABASE_SERVICE_ROLE_KEY → SUPABASE_SERVICE_KEY pour compatibilité
const importEnv = {
  ...process.env,
  SUPABASE_URL:         process.env.SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY
                     ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
};

const importRes = run("python3", [importScript], {
  input: "oui\n",
  cwd:   CATALOG_ROOT,
  env:   importEnv,
});

if (importRes.stdout) process.stdout.write(importRes.stdout);
if (importRes.stderr) process.stderr.write(importRes.stderr);

if (importRes.status !== 0) {
  fail("import_catalog.py a échoué (voir ci-dessus).");
}
ok("Import Supabase terminé.");

// ── Étape d : Génération waveforms ────────────────────────────────────────────

header("d", "Génération waveforms");

const waveformScript = new URL("./generate-waveforms-catalog.mjs", import.meta.url).pathname;
const waveformRes = run(
  process.execPath,
  [waveformScript, albumName],
  { stdio: "inherit", env: process.env }
);

if (waveformRes.status !== 0) {
  warn("La génération des waveforms a rencontré des erreurs (non bloquant).");
} else {
  ok("Waveforms générées.");
}

// ── Étape e : Git commit & push ───────────────────────────────────────────────

header("e", "Git commit & push");

const gitRoot = new URL("..", import.meta.url).pathname;

function git(args, opts = {}) {
  return run("git", args, { cwd: gitRoot, encoding: "utf8", ...opts });
}

// Vérifier s'il y a quelque chose à committer
const statusRes = git(["status", "--porcelain"]);
const hasChanges = statusRes.stdout?.trim().length > 0;

if (!hasChanges) {
  ok("Rien à committer (working tree propre).");
} else {
  const addRes = git(["add", "."]);
  if (addRes.status !== 0) {
    warn(`git add a échoué : ${addRes.stderr?.trim()}`);
  }

  const commitMsg = `feat: ajout album ${albumName}`;
  const commitRes = git(["commit", "-m", commitMsg]);
  if (commitRes.status !== 0) {
    warn(`git commit a échoué : ${commitRes.stderr?.trim()}`);
  } else {
    ok(`Commit : "${commitMsg}"`);
    const pushRes = git(["push"]);
    if (pushRes.status !== 0) {
      warn(`git push a échoué : ${pushRes.stderr?.trim()}`);
      warn("Committé localement — poussez manuellement avec : git push");
    } else {
      ok("Push effectué.");
    }
  }
}

// ── Récapitulatif ─────────────────────────────────────────────────────────────

console.log(`\n${"╔" + "═".repeat(W - 2) + "╗"}`);
console.log(`  SYNC TERMINÉ — ${albumName}`);
console.log(`${"╚" + "═".repeat(W - 2) + "╝"}\n`);

/**
 * setup-hooks.mjs
 * Installe le hook git pre-commit qui génère automatiquement
 * les waveforms manquantes avant chaque commit.
 * Lancé automatiquement via "npm install" (postinstall).
 */

import { writeFileSync, chmodSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const hooksDir = join(process.cwd(), ".git", "hooks");

if (!existsSync(hooksDir)) {
  console.log("ℹ Pas de dossier .git/hooks — hook non installé.");
  process.exit(0);
}

mkdirSync(hooksDir, { recursive: true });

const hookPath = join(hooksDir, "pre-commit");

const hookContent = `#!/bin/sh
# Auto-généré par scripts/setup-hooks.mjs
# Génère les waveforms JSON manquantes avant chaque commit.

node scripts/generate-waveforms.mjs

# Stager les nouveaux JSON si afconvert a tourné
git add public/audio/waveforms/*.json 2>/dev/null || true
`;

writeFileSync(hookPath, hookContent);
chmodSync(hookPath, "755");

console.log("✓ Hook pre-commit installé (génération waveforms automatique).");

/* Leonida Cover Studio - main.ts
   Entry program (Node 22, standard library only). It hands the app in:
   it mirrors the repository's app/ and screenshots/ into the output
   directory, then writes dossier.json there with buildDossier from
   vendor/makefun-app.ts. Outside the grader, MAKEFUN_OUTPUT_DIR
   stands in for /output; with neither set, /output is used.
   Running it twice over the same repository writes identical bytes. */

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

/* The repository root is the directory holding this file. */
const repoRoot = dirname(fileURLToPath(import.meta.url));

/* Where the entry goes: the environment's override, else /output. */
const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

/* The bounty gate's caps for this entry's dossier. */
const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000
};

function mirrorTree(sourceDir: string, targetDir: string): void {
  if (!existsSync(sourceDir)) {
    throw new Error(`main.ts: missing ${sourceDir}`);
  }
  mkdirSync(targetDir, { recursive: true });
  cpSync(sourceDir, targetDir, { recursive: true });
}

function handIn(): void {
  /* Start from an empty output directory so stale files from an
     earlier run can never leak into this entry. Clear only the
     contents, never the directory itself: in the grader /output is
     a mount point and removing it fails with EBUSY. */
  mkdirSync(outputDir, { recursive: true });
  for (const entry of readdirSync(outputDir)) {
    rmSync(join(outputDir, entry), { recursive: true, force: true });
  }
  mirrorTree(join(repoRoot, 'app'), join(outputDir, 'app'));
  mirrorTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));
  const dossier = buildDossier(outputDir, dossierCaps);
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
  console.log(`entry written to ${outputDir} (dossier.json: ${dossier.length} bytes)`);
}

handIn();

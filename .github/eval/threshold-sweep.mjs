#!/usr/bin/env node
/**
 * threshold-sweep.mjs — Run score-routing at multiple thresholds and report
 * the Precision / Recall / F1 / Lines-loaded tradeoff for each architecture.
 *
 * Usage:
 *   node threshold-sweep.mjs               # default sweep: 0.20–0.50 step 0.05
 *   node threshold-sweep.mjs 0.25 0.45 0.05  # custom: start end step
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { initEmbedder, embedText, cosineSimilarity } from './lib/embeddings.mjs';
import { loadSkills } from './lib/loader.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = join(__dirname, '..', 'skills');
const LEGACY_DIR = join(SKILLS_DIR, '_legacy');

// ── parse optional args: start end step ──────────────────────────
const a = process.argv.slice(2).map(Number);
const START = a[0] || 0.20;
const END = a[1] || 0.50;
const STEP = a[2] || 0.05;

function thresholds() {
  const t = [];
  for (let v = START; v <= END + 1e-9; v += STEP) t.push(Math.round(v * 100) / 100);
  return t;
}

function computeAtThreshold(ranked, expected, threshold) {
  const selected = ranked.filter(r => r.sim >= threshold);
  const selectedFiles = new Set(selected.map(r => r.file));
  const tp = expected.filter(f => selectedFiles.has(f)).length;
  const p = selected.length > 0 ? tp / selected.length : 0;
  const r = expected.length > 0 ? tp / expected.length : 0;
  const f1 = p + r > 0 ? (2 * p * r) / (p + r) : 0;
  const lines = selected.reduce((sum, x) => sum + x.lines, 0);
  return { p, r, f1, lines };
}

function rank(queryEmb, skills, skillEmbs) {
  return skills
    .map((s, i) => ({
      file: s.file,
      lines: s.lines,
      sim: cosineSimilarity(queryEmb, skillEmbs[i]),
    }))
    .sort((a, b) => b.sim - a.sim);
}

const fmt = v => v.toFixed(3);

async function main() {
  const { cases } = yaml.load(readFileSync(join(__dirname, 'test-cases.yaml'), 'utf-8'));
  const mainSkills = loadSkills(LEGACY_DIR);
  const branchSkills = loadSkills(SKILLS_DIR);

  console.log('\n  Loading model...');
  await initEmbedder();
  console.log('  Model ready.\n');

  // Pre-compute embeddings
  const mainEmbs = [];
  for (const s of mainSkills) mainEmbs.push(await embedText(s.searchText));
  const branchEmbs = [];
  for (const s of branchSkills) branchEmbs.push(await embedText(s.searchText));

  // Pre-compute rankings (threshold-independent)
  const rankings = [];
  for (const tc of cases) {
    const qEmb = await embedText(tc.query);
    rankings.push({
      tc,
      mainRanked: rank(qEmb, mainSkills, mainEmbs),
      branchRanked: rank(qEmb, branchSkills, branchEmbs),
    });
  }

  const ts = thresholds();
  const n = cases.length;

  console.log('┌──────────────────────────────────────────────────────────────────────────┐');
  console.log('│  Threshold Sweep — Precision / Recall / F1 / Lines                       │');
  console.log('└──────────────────────────────────────────────────────────────────────────┘');
  console.log();

  // Header
  const hdr = '  Thresh  │  Main P   Main R   Main F1  Lines  │  Br P     Br R     Br F1   Lines  │  ΔF1';
  const sep = '  ────────┼────────────────────────────────────┼────────────────────────────────────┼───────';
  console.log(hdr);
  console.log(sep);

  let bestMainF1 = 0, bestMainT = 0;
  let bestBranchF1 = 0, bestBranchT = 0;

  for (const t of ts) {
    let mP = 0, mR = 0, mF1 = 0, mL = 0;
    let bP = 0, bR = 0, bF1 = 0, bL = 0;

    for (const { tc, mainRanked, branchRanked } of rankings) {
      const mm = computeAtThreshold(mainRanked, tc.expected.main, t);
      const bm = computeAtThreshold(branchRanked, tc.expected.branch, t);
      mP += mm.p; mR += mm.r; mF1 += mm.f1; mL += mm.lines;
      bP += bm.p; bR += bm.r; bF1 += bm.f1; bL += bm.lines;
    }

    mP /= n; mR /= n; mF1 /= n; mL /= n;
    bP /= n; bR /= n; bF1 /= n; bL /= n;

    if (mF1 > bestMainF1) { bestMainF1 = mF1; bestMainT = t; }
    if (bF1 > bestBranchF1) { bestBranchF1 = bF1; bestBranchT = t; }

    const dF1 = bF1 - mF1;
    const dSign = dF1 >= 0 ? '+' : '';

    console.log(
      `  ${t.toFixed(2)}    │  ${fmt(mP)}   ${fmt(mR)}   ${fmt(mF1)}   ${String(Math.round(mL)).padEnd(5)}│  ${fmt(bP)}   ${fmt(bR)}   ${fmt(bF1)}   ${String(Math.round(bL)).padEnd(5)}│  ${dSign}${fmt(dF1)}`
    );
  }

  console.log(sep);
  console.log(`\n  Best Main   F1: ${fmt(bestMainF1)} at threshold ${bestMainT.toFixed(2)}`);
  console.log(`  Best Branch F1: ${fmt(bestBranchF1)} at threshold ${bestBranchT.toFixed(2)}`);
  console.log();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

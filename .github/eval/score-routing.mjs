#!/usr/bin/env node
/**
 * score-routing.mjs — Evaluate skill routing accuracy via embedding similarity.
 *
 * Compares monolithic (main/_legacy) vs atomic (branch) skill architectures
 * by ranking skills against natural-language test queries.
 *
 * Usage:
 *   node score-routing.mjs              # compare both architectures
 *   node score-routing.mjs --arch main  # evaluate main only
 *   node score-routing.mjs --arch branch
 *
 * Env vars:
 *   THRESHOLD  — similarity cutoff (default 0.35)
 *   TOP_K      — max skills shown per case (default 5)
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { initEmbedder, embedText, cosineSimilarity } from './lib/embeddings.mjs';
import { loadSkills } from './lib/loader.mjs';

// ── paths ────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = join(__dirname, '..', 'skills');
const LEGACY_DIR = join(SKILLS_DIR, '_legacy');

// ── config ───────────────────────────────────────────────────────
const THRESHOLD = parseFloat(process.env.THRESHOLD || '0.35');
const TOP_K = parseInt(process.env.TOP_K || '5', 10);

// ── arg parsing ──────────────────────────────────────────────────
const args = process.argv.slice(2);
let archMode = 'compare'; // main | branch | compare
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--arch' && args[i + 1]) archMode = args[i + 1];
  if (args[i].startsWith('--arch=')) archMode = args[i].split('=')[1];
}
const runMain = archMode === 'main' || archMode === 'compare';
const runBranch = archMode === 'branch' || archMode === 'compare';

// ── helpers ──────────────────────────────────────────────────────

function rank(queryEmb, skills, skillEmbs) {
  return skills
    .map((s, i) => ({
      file: s.file,
      lines: s.lines,
      sim: cosineSimilarity(queryEmb, skillEmbs[i]),
    }))
    .sort((a, b) => b.sim - a.sim);
}

function computeMetrics(ranked, expected) {
  const selected = ranked.filter(r => r.sim >= THRESHOLD);
  const selectedFiles = new Set(selected.map(r => r.file));
  const expectedSet = new Set(expected);

  // Negative case: empty expected → precision = 1 if nothing selected, 0 otherwise
  if (expected.length === 0) {
    const precision = selected.length === 0 ? 1 : 0;
    const recall = 1; // vacuously true
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    const linesLoaded = selected.reduce((sum, r) => sum + r.lines, 0);
    return { precision, recall, f1, mrr: 1, linesLoaded, tp: 0, selectedCount: selected.length };
  }

  const tp = expected.filter(f => selectedFiles.has(f)).length;
  const precision = selected.length > 0 ? tp / selected.length : 0;
  const recall = expected.length > 0 ? tp / expected.length : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  // Mean Reciprocal Rank — rank of first expected hit
  let mrr = 0;
  for (let i = 0; i < ranked.length; i++) {
    if (expectedSet.has(ranked[i].file)) {
      mrr = 1 / (i + 1);
      break;
    }
  }

  const linesLoaded = selected.reduce((sum, r) => sum + r.lines, 0);
  return { precision, recall, f1, mrr, linesLoaded, tp, selectedCount: selected.length };
}

function shortName(file) {
  return file.replace(/[-_]SKILL\.md$/, '');
}

function fmtSim(v) {
  return v.toFixed(3);
}

function fmtPct(v) {
  return v.toFixed(2);
}

// ── output ───────────────────────────────────────────────────────

function printCase(tc, mainTop, branchTop, mainM, branchM) {
  const bar = '─'.repeat(72);
  console.log(`\n${bar}`);
  console.log(`  ${tc.id}  |  ${tc.role}  |  Stage ${tc.stage}`);
  console.log(`  "${tc.query}"`);

  if (runMain && runBranch) {
    // Side-by-side
    const mainExp = new Set(tc.expected.main);
    const branchExp = new Set(tc.expected.branch);
    const rows = Math.max(mainTop.length, branchTop.length);

    console.log();
    console.log(`  ${'MAIN (monolithic)'.padEnd(36)}${'BRANCH (atomic)'}`);
    console.log(`  ${'─'.repeat(34)}  ${'─'.repeat(34)}`);
    for (let i = 0; i < rows; i++) {
      const m = mainTop[i];
      const b = branchTop[i];
      const mMark = m ? (mainExp.has(m.file) ? '✓' : m.sim >= THRESHOLD ? '●' : ' ') : ' ';
      const bMark = b ? (branchExp.has(b.file) ? '✓' : b.sim >= THRESHOLD ? '●' : ' ') : ' ';
      const mStr = m ? `${mMark} ${(i + 1)}. ${shortName(m.file).slice(0, 22).padEnd(22)} ${fmtSim(m.sim)}` : '';
      const bStr = b ? `${bMark} ${(i + 1)}. ${shortName(b.file).slice(0, 22).padEnd(22)} ${fmtSim(b.sim)}` : '';
      console.log(`  ${mStr.padEnd(36)}${bStr}`);
    }

    console.log();
    console.log(`  ${''.padEnd(18)}Main      Branch     Δ`);
    console.log(`  Precision       ${fmtPct(mainM.precision).padEnd(10)}${fmtPct(branchM.precision).padEnd(11)}${delta(mainM.precision, branchM.precision)}`);
    console.log(`  Recall          ${fmtPct(mainM.recall).padEnd(10)}${fmtPct(branchM.recall).padEnd(11)}${delta(mainM.recall, branchM.recall)}`);
    console.log(`  F1              ${fmtPct(mainM.f1).padEnd(10)}${fmtPct(branchM.f1).padEnd(11)}${delta(mainM.f1, branchM.f1)}`);
    console.log(`  MRR             ${fmtPct(mainM.mrr).padEnd(10)}${fmtPct(branchM.mrr).padEnd(11)}${delta(mainM.mrr, branchM.mrr)}`);
    console.log(`  Lines loaded    ${String(mainM.linesLoaded).padEnd(10)}${String(branchM.linesLoaded).padEnd(11)}${deltaLines(mainM.linesLoaded, branchM.linesLoaded)}`);
  } else {
    // Single architecture
    const top = runMain ? mainTop : branchTop;
    const met = runMain ? mainM : branchM;
    const exp = new Set(runMain ? tc.expected.main : tc.expected.branch);
    const label = runMain ? 'MAIN' : 'BRANCH';

    console.log(`\n  ${label} — Top ${TOP_K} matches:`);
    for (let i = 0; i < top.length; i++) {
      const r = top[i];
      const mark = exp.has(r.file) ? '✓' : r.sim >= THRESHOLD ? '●' : ' ';
      console.log(`  ${mark} ${i + 1}. ${shortName(r.file).padEnd(30)} ${fmtSim(r.sim)}`);
    }
    console.log(`\n  P: ${fmtPct(met.precision)}  R: ${fmtPct(met.recall)}  F1: ${fmtPct(met.f1)}  MRR: ${fmtPct(met.mrr)}  Lines: ${met.linesLoaded}`);
  }
}

function printFalsePositives(tc, branchRanked) {
  if (!tc.not_expected_branch) return;
  const bad = new Set(tc.not_expected_branch);
  const hits = branchRanked.filter(r => r.sim >= THRESHOLD && bad.has(r.file));
  if (hits.length > 0) {
    console.log(`  ⚠ False-positive hits: ${hits.map(h => `${shortName(h.file)} (${fmtSim(h.sim)})`).join(', ')}`);
  }
}

function delta(a, b) {
  const d = b - a;
  const sign = d > 0 ? '+' : '';
  return `${sign}${d.toFixed(2)}`;
}

function deltaLines(a, b) {
  const d = b - a;
  const pct = a > 0 ? ((d / a) * 100).toFixed(0) : '∞';
  return `${d > 0 ? '+' : ''}${d} (${pct}%)`;
}

function printSummary(results) {
  const bar = '═'.repeat(72);
  console.log(`\n${bar}`);
  console.log('  AGGREGATE SUMMARY');
  console.log(bar);

  const n = results.length;
  const avg = (fn) => results.reduce((s, r) => s + fn(r), 0) / n;

  if (runMain && runBranch) {
    const rows = [
      ['Avg Precision', avg(r => r.mainMetrics.precision), avg(r => r.branchMetrics.precision)],
      ['Avg Recall', avg(r => r.mainMetrics.recall), avg(r => r.branchMetrics.recall)],
      ['Avg F1', avg(r => r.mainMetrics.f1), avg(r => r.branchMetrics.f1)],
      ['Avg MRR', avg(r => r.mainMetrics.mrr), avg(r => r.branchMetrics.mrr)],
    ];

    console.log(`\n  ${'Metric'.padEnd(18)}${'Main'.padEnd(10)}${'Branch'.padEnd(10)}Δ`);
    console.log(`  ${'─'.repeat(18)}${'─'.repeat(10)}${'─'.repeat(10)}${'─'.repeat(10)}`);
    for (const [label, m, b] of rows) {
      console.log(`  ${label.padEnd(18)}${fmtPct(m).padEnd(10)}${fmtPct(b).padEnd(10)}${delta(m, b)}`);
    }

    const mainLines = avg(r => r.mainMetrics.linesLoaded);
    const branchLines = avg(r => r.branchMetrics.linesLoaded);
    console.log(`  ${'Avg Lines'.padEnd(18)}${String(Math.round(mainLines)).padEnd(10)}${String(Math.round(branchLines)).padEnd(10)}${deltaLines(mainLines, branchLines)}`);

    // False positive summary
    if (runBranch) {
      const fpCases = results.filter(r => {
        const bad = new Set(r.tc.not_expected_branch || []);
        return r.branchRanked.some(x => x.sim >= THRESHOLD && bad.has(x.file));
      });
      console.log(`\n  False-positive cases (branch): ${fpCases.length}/${n}`);
    }
  } else {
    const key = runMain ? 'mainMetrics' : 'branchMetrics';
    console.log(`\n  Avg Precision : ${fmtPct(avg(r => r[key].precision))}`);
    console.log(`  Avg Recall    : ${fmtPct(avg(r => r[key].recall))}`);
    console.log(`  Avg F1        : ${fmtPct(avg(r => r[key].f1))}`);
    console.log(`  Avg MRR       : ${fmtPct(avg(r => r[key].mrr))}`);
    console.log(`  Avg Lines     : ${Math.round(avg(r => r[key].linesLoaded))}`);
  }

  console.log();
}

// ── main ─────────────────────────────────────────────────────────

async function main() {
  // Load test cases
  const { cases } = yaml.load(readFileSync(join(__dirname, 'test-cases.yaml'), 'utf-8'));

  // Load skill descriptions for each architecture
  const mainSkills = runMain ? loadSkills(LEGACY_DIR) : [];
  const branchSkills = runBranch ? loadSkills(SKILLS_DIR) : [];

  console.log('\n┌────────────────────────────────────────────────────────────────┐');
  console.log('│  Skill Routing Eval — Embedding Similarity                     │');
  console.log('└────────────────────────────────────────────────────────────────┘');
  console.log(`  Model     : Xenova/all-MiniLM-L6-v2`);
  console.log(`  Threshold : ${THRESHOLD}  |  Top-K : ${TOP_K}  |  Mode : ${archMode}`);
  if (runMain) console.log(`  Main      : ${mainSkills.length} skills (monolithic)`);
  if (runBranch) console.log(`  Branch    : ${branchSkills.length} skills (atomic)`);
  console.log(`  Cases     : ${cases.length}`);

  // Initialize model
  console.log('\n  Loading embedding model (downloads ~23 MB on first run)...');
  await initEmbedder();
  console.log('  Model ready.');

  // Pre-compute skill embeddings
  const mainEmbs = [];
  for (const s of mainSkills) mainEmbs.push(await embedText(s.searchText));
  const branchEmbs = [];
  for (const s of branchSkills) branchEmbs.push(await embedText(s.searchText));

  // Evaluate
  const results = [];
  for (const tc of cases) {
    const qEmb = await embedText(tc.query);

    const mainRanked = runMain ? rank(qEmb, mainSkills, mainEmbs) : [];
    const branchRanked = runBranch ? rank(qEmb, branchSkills, branchEmbs) : [];

    const mainMetrics = runMain ? computeMetrics(mainRanked, tc.expected.main) : null;
    const branchMetrics = runBranch ? computeMetrics(branchRanked, tc.expected.branch) : null;

    results.push({ tc, mainRanked, branchRanked, mainMetrics, branchMetrics });

    printCase(
      tc,
      mainRanked.slice(0, TOP_K),
      branchRanked.slice(0, TOP_K),
      mainMetrics || {},
      branchMetrics || {},
    );

    if (runBranch) printFalsePositives(tc, branchRanked);
  }

  printSummary(results);
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});

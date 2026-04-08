#!/usr/bin/env node

/**
 * bootstrap-user.js — Set up user-level Copilot config outside the repo.
 *
 * Run once on a new machine after cloning:
 *   node scripts/bootstrap-user.js
 *
 * What it does:
 *   1. Creates ~/.github/copilot-instructions.md (if missing)
 *   2. Symlinks key instruction files to ~/.github/instructions/
 *   3. Creates ~/.copilot/mcp-config.json for Copilot CLI
 *   4. Adds OBSIDIAN_VAULT to ~/.zshrc (if not already present)
 *   5. Creates vault output directories
 *
 * Safe to re-run — skips anything already in place.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, symlinkSync, appendFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { homedir, platform } from "node:os";

const ROOT = resolve(import.meta.dirname, "..");
const HOME = homedir();
const isMac = platform() === "darwin";

// ── Helpers ────────────────────────────────────────────────────────
function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`  ✓ Created ${dir}`);
  }
}

function writeIfMissing(path, content, label) {
  if (existsSync(path)) {
    console.log(`  · ${label} — already exists, skipping`);
    return false;
  }
  writeFileSync(path, content, "utf-8");
  console.log(`  ✓ ${label} — created`);
  return true;
}

function symlinkIfMissing(target, linkPath, label) {
  if (existsSync(linkPath)) {
    console.log(`  · ${label} — already exists, skipping`);
    return;
  }
  if (!existsSync(target)) {
    console.log(`  ✗ ${label} — target not found: ${target}`);
    return;
  }
  symlinkSync(target, linkPath);
  console.log(`  ✓ ${label} — symlinked`);
}

// ── Read vault path from .env ──────────────────────────────────────
function getVaultPath() {
  const envFile = join(ROOT, ".env");
  if (!existsSync(envFile)) return null;
  const lines = readFileSync(envFile, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("OBSIDIAN_VAULT_PATH=")) {
      return trimmed.slice("OBSIDIAN_VAULT_PATH=".length).replace(/^["']|["']$/g, "");
    }
  }
  return null;
}

const VAULT = getVaultPath() || process.env.OBSIDIAN_VAULT_PATH || process.env.OBSIDIAN_VAULT;

// ── 1. ~/.github/copilot-instructions.md ───────────────────────────
console.log("\n1. User-level copilot-instructions");
ensureDir(join(HOME, ".github"));

const copilotInstructions = `# Personal Assistant — Global Copilot Instructions

You are Sam Cogan's personal AI assistant. You operate across workspaces, not just within a specific codebase.

## Identity

Sam is a Senior Cloud Solution Architect at Microsoft UK. For full personal context, see \`~/.github/instructions/personal-context.instructions.md\`.

## Core Behavior

- **Concise**: Lead with actions taken, not explanations. One focused question when ambiguous.
- **Assistant, not IDE**: You are a brain that orchestrates across Sam's systems (CRM, M365, Obsidian vault, Things 3, Power BI). You are NOT a project-scoped coding agent.
- **Vault-first**: For account-specific work, start in the Obsidian vault before querying live systems.
- **Multi-medium**: Cross-reference at least two mediums (CRM + M365 or vault). State sources; flag stale or silent mediums.
- **Risk surfacing**: Surface one proactive risk when account-state data is in scope.
- **Write safety**: Human confirmation required before any write operation. See \`msx-role-and-write-gate.instructions.md\`.

## File Output Routing

Generated file artifacts do NOT belong in any git repo. Route them to the Obsidian vault:

| Artifact type | Default path |
|---|---|
| Customer-specific docs | \`Customers/<Customer>/Outputs/<name>.<ext>\` |
| General docs | \`0. Inbox/Agent Output/<name>.<ext>\` |
| Excalidraw diagrams | \`0. Inbox/Agent Output/excalidraw/<name>.excalidraw\` |

- Create directories automatically before writing.
- If the user provides an explicit output path, honor it instead.
- Use descriptive filenames: \`<customer>-<artifact>-<date>.<ext>\`.
- **NEVER save generated artifacts into a git repository working tree** unless explicitly asked.

## MCAPS IQ Brain

The full skill library, detailed instructions, agent definitions, and eval framework live at \`${ROOT}\`. This repo is the agent's configuration source — not a project to edit.

## Daily Workflow

- **VS Code**: Open the mcaps-iq repo for full assistant experience with all MCP servers, skills, and instructions.
- **Other VS Code windows**: MCP servers available via user-level mcp.json.
`;

writeIfMissing(join(HOME, ".github", "copilot-instructions.md"), copilotInstructions, "copilot-instructions.md");

// ── 2. Symlink key instructions ────────────────────────────────────
console.log("\n2. Instruction symlinks");
ensureDir(join(HOME, ".github", "instructions"));

const instructionsToLink = [
  "intent.instructions.md",
  "obsidian-vault.instructions.md",
  "obsidian-project-management.instructions.md",
  "shared-patterns.instructions.md",
  "msx-role-and-write-gate.instructions.md",
];

for (const file of instructionsToLink) {
  const target = join(ROOT, ".github", "instructions", file);
  const link = join(HOME, ".github", "instructions", file);
  symlinkIfMissing(target, link, file);
}

// ── 3. ~/.copilot/mcp-config.json (for future CLI use) ────────────
console.log("\n3. Copilot CLI MCP config");
ensureDir(join(HOME, ".copilot"));

const cliMcpConfig = {
  mcpServers: {
    "msx-crm": {
      type: "local",
      command: "node",
      args: [join(ROOT, "scripts/msx-start.js")],
      tools: ["*"],
    },
    oil: {
      type: "local",
      command: "node",
      args: [join(ROOT, "scripts/oil-start.js")],
      tools: ["*"],
    },
    excalidraw: {
      type: "local",
      command: "node",
      args: [join(ROOT, "mcp/excalidraw/src/index.js")],
      env: {
        REPO_ROOT: ROOT,
        ...(VAULT ? { OBSIDIAN_VAULT_PATH: VAULT } : {}),
      },
      tools: ["*"],
    },
    workiq01: {
      type: "local",
      command: "npx",
      args: ["-y", "@microsoft/workiq@latest", "mcp"],
      tools: ["*"],
    },
  },
};

writeIfMissing(
  join(HOME, ".copilot", "mcp-config.json"),
  JSON.stringify(cliMcpConfig, null, 2) + "\n",
  "mcp-config.json"
);

// ── 4. Shell env var ───────────────────────────────────────────────
console.log("\n4. Shell environment");
if (VAULT) {
  const zshrc = join(HOME, ".zshrc");
  if (existsSync(zshrc)) {
    const content = readFileSync(zshrc, "utf-8");
    if (content.includes("OBSIDIAN_VAULT=")) {
      console.log("  · OBSIDIAN_VAULT already in .zshrc");
    } else {
      appendFileSync(zshrc, `\n# Obsidian vault for mcaps CLI\nexport OBSIDIAN_VAULT="${VAULT}"\n`);
      console.log("  ✓ Added OBSIDIAN_VAULT to .zshrc");
    }
  } else {
    console.log("  · No .zshrc found — set OBSIDIAN_VAULT manually");
  }
} else {
  console.log("  · No vault path found in .env — skipping OBSIDIAN_VAULT");
}

// ── 5. Vault output directories ────────────────────────────────────
console.log("\n5. Vault output directories");
if (VAULT && existsSync(VAULT)) {
  ensureDir(join(VAULT, "0. Inbox", "Agent Output", "excalidraw"));
  ensureDir(join(VAULT, "0. Inbox", "Agent Output", "pbi"));
  console.log("  ✓ Output directories ready");
} else {
  console.log("  · Vault not found — create output dirs manually after configuring vault");
}

console.log("\n✅ Bootstrap complete. Restart VS Code to pick up changes.\n");

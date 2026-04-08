---
title: Setup on a New Machine
description: Replicate your full MCAPS IQ environment on another computer.
tags:
  - getting-started
  - installation
  - multi-machine
---

# Setup on a New Machine

Already running MCAPS IQ on one machine and want the same experience on another (e.g. a laptop)? This guide covers everything beyond the basic install.

!!! tip "First time?"
    If this is your very first setup, start with **[Prerequisites](prerequisites.md)** and **[Installation](installation.md)** instead.

---

## What the Bootstrap Does

MCAPS IQ stores personal configuration _outside_ the repo — user-level Copilot instructions, shell environment variables, MCP server definitions, and Obsidian vault output directories. The bootstrap script sets all of this up in one command.

| Step | What it creates | Location |
|------|----------------|----------|
| 1 | User-level Copilot personality | `~/.github/copilot-instructions.md` |
| 2 | Instruction symlinks | `~/.github/instructions/` → repo files |
| 3 | Copilot CLI MCP config | `~/.copilot/mcp-config.json` |
| 4 | `OBSIDIAN_VAULT` env var | `~/.zshrc` |
| 5 | Vault output directories | `<vault>/0. Inbox/Agent Output/` |
| 6 | VS Code user-level MCP servers | `~/Library/Application Support/Code/User/mcp.json` |

---

## Quick Setup

### 1. Complete the standard install

```bash
git clone https://github.com/microsoft/mcaps-iq.git
cd mcaps-iq
npm install
az login
```

See [Installation](installation.md) for details.

### 2. Configure your Obsidian vault path

Create a `.env` file in the repo root (or copy from your other machine):

```bash
# .env
OBSIDIAN_VAULT_PATH="/path/to/your/obsidian/vault"
```

!!! note
    The bootstrap reads this path to set up vault output directories and shell env vars. If you skip this, those steps are skipped — you can configure them manually later.

### 3. Run the bootstrap

```bash
npm run setup:user
```

You'll see output like:

```
1. User-level copilot-instructions
  ✓ copilot-instructions.md — created

2. Instruction symlinks
  ✓ intent.instructions.md — symlinked
  ✓ obsidian-vault.instructions.md — symlinked
  ...

3. Copilot CLI MCP config
  ✓ mcp-config.json — created

4. Shell environment
  ✓ Added OBSIDIAN_VAULT to .zshrc

5. Vault output directories
  ✓ Output directories ready

6. VS Code user-level mcp.json
  ✓ Installed to ~/Library/Application Support/Code/User/mcp.json

✅ Bootstrap complete. Restart VS Code to pick up changes.
```

### 4. Restart VS Code

Close and reopen VS Code so it picks up the new user-level `mcp.json` and instructions.

### 5. Start the MCP servers

Open `.vscode/mcp.json` and click **Start** on the servers you need (at minimum `msx-crm`).

---

## What Each Step Does

### User-level Copilot instructions

Creates `~/.github/copilot-instructions.md` — this defines the assistant's personality, file-output routing rules, and vault-first behavior. It applies in **every** VS Code window, not just the mcaps-iq workspace.

### Instruction symlinks

Symlinks five key instruction files from the repo to `~/.github/instructions/` so they're available globally:

- `intent.instructions.md` — agent intent and multi-medium model
- `obsidian-vault.instructions.md` — vault integration rules
- `obsidian-project-management.instructions.md` — PARA structure and project hubs
- `shared-patterns.instructions.md` — output conventions and artifact routing
- `msx-role-and-write-gate.instructions.md` — write safety and role mapping

!!! info "Pre-existing files"
    If you already have personal instructions at `~/.github/instructions/` (e.g. `personal-context.instructions.md`, `things3-mcp.instructions.md`), they are left untouched. The symlinks only add the five repo files.

### Copilot CLI MCP config

Creates `~/.copilot/mcp-config.json` with local MCP servers (msx-crm, oil, excalidraw, workiq). This is for future Copilot CLI use.

!!! warning "CLI limitations"
    HTTP-based MCP servers (M365 calendar, Teams, mail, Power BI) require VS Code's built-in auth provider and don't work in the CLI yet. The CLI config only includes stdio-based servers.

### VS Code user-level MCP servers

Installs MCP server definitions to `~/Library/Application Support/Code/User/mcp.json` (macOS) or `%APPDATA%\Code\User\mcp.json` (Windows). This makes servers available in **all** VS Code windows, not just when the repo is open.

The template lives in the repo at `config/user-mcp.jsonc` with placeholder tokens (`{{REPO_ROOT}}`, `{{HOME}}`, `{{VAULT_PATH}}`). The bootstrap substitutes these with actual paths for your machine.

!!! warning "Existing mcp.json"
    If you already have a `mcp.json` in your VS Code user directory (e.g. from other MCP servers like Terraform, Things, etc.), the bootstrap **skips** this step to avoid overwriting your config. You'll need to merge manually — copy the relevant server blocks from `config/user-mcp.jsonc` into your existing file and replace the placeholders.

---

## Manual Merge (if mcp.json already exists)

If step 6 was skipped because you have an existing `mcp.json`:

1. Open `config/user-mcp.jsonc` in the repo
2. Open your existing `~/Library/Application Support/Code/User/mcp.json`
3. Copy the server blocks you need (look for the `MCAPS IQ` and `M365` sections)
4. Replace placeholders:

    | Placeholder | Replace with |
    |-------------|-------------|
    | `{{REPO_ROOT}}` | Absolute path to your mcaps-iq clone (e.g. `/Users/you/repos/mcaps-iq`) |
    | `{{HOME}}` | Your home directory (e.g. `/Users/you`) |
    | `{{VAULT_PATH}}` | Absolute path to your Obsidian vault |

---

## Re-running the Bootstrap

The bootstrap is safe to re-run at any time — it skips anything already in place:

```bash
npm run setup:user
```

```
1. User-level copilot-instructions
  · copilot-instructions.md — already exists, skipping
...
```

To force a fresh setup of a specific file, delete it first and re-run.

---

## Verifying the Setup

After bootstrap, confirm everything is wired up:

| Check | Command |
|-------|---------|
| User instructions exist | `cat ~/.github/copilot-instructions.md` |
| Symlinks are valid | `ls -la ~/.github/instructions/` |
| Shell env var | `source ~/.zshrc && echo $OBSIDIAN_VAULT` |
| VS Code MCP loaded | Open VS Code → `Cmd+Shift+P` → "MCP: List Servers" |
| CRM access | Open Copilot chat → `Who am I in MSX?` |

---

## Platform Notes

=== "macOS"

    Everything works out of the box. The bootstrap handles `.zshrc` and the macOS VS Code config path.

=== "Windows"

    - Shell env var step targets `.zshrc` — if you use PowerShell, set `OBSIDIAN_VAULT` in your profile manually:
      ```powershell
      [Environment]::SetEnvironmentVariable("OBSIDIAN_VAULT", "C:\path\to\vault", "User")
      ```
    - VS Code config path: `%APPDATA%\Code\User\mcp.json`
    - Symlinks require Developer Mode enabled or an elevated terminal

=== "Linux"

    Same as macOS. The bootstrap targets `.zshrc` — adjust if you use a different shell.

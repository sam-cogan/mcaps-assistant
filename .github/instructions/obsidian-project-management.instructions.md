---
description: "Obsidian vault PARA structure and project hub note conventions for personal project management. Complements the CRM-focused obsidian-vault.instructions.md. Use when creating, updating, or reviewing project hub notes, processing status updates, running weekly reviews, or navigating the PARA folder layout. Triggers: hub note, project status, PARA, project folder, status log, project archive, weekly review, new project, status update."
---

# Obsidian Vault — Project Management Conventions

This covers personal project management in the vault. For CRM/customer context operations, see `obsidian-vault.instructions.md`.

## PARA Folder Layout

| Path | Purpose |
|------|---------|
| `0. Inbox/` | Unprocessed captures |
| `1. Projects/{Name}/` | Active projects — each has a hub note at `1. Projects/{Name}/{Name}.md` |
| `2. Areas/` | Ongoing responsibilities |
| `3. Resources/` | Reference material |
| `4. Archive/` | Completed/inactive projects |
| `Journal/Daily/` | Daily work logs named `Work - YYYY-MM-DD.md` |
| `z_templates/` | Templater templates |
| `z_periodic_notes/` | Weekly reviews and periodic notes |

## Hub Note Format

### Frontmatter

```yaml
---
status: [🟢 On Track | 🟡 Active | 🔴 Blocked | ⏸️ On Hold | ✅ Complete]
type: [Customer Engagement | Internal | Learning | Community]
customer: [name or blank]
started: YYYY-MM-DD
last-reviewed: YYYY-MM-DD
next-action: [single most important next action]
owner: Sam
things-project: [exact Things project name]
---
```

### Sections (in order)

1. Dataview table of child notes
2. `## Overview` — 2–3 sentences: what, why, expected outcome
3. `## Current Status` — what is happening right now
4. `## Blockers & Risks` — anything slowing progress
5. `## Next Steps` — checkbox list
6. `## Key Decisions` — decisions made and rationale
7. `## Status Log` — newest-first dated entries using `### YYYY-MM-DD` headers

## Status Values

| Status | Meaning |
|--------|---------|
| 🟢 On Track | Progressing normally, no issues |
| 🟡 Active | In progress, needs attention |
| 🔴 Blocked | Cannot progress, waiting on external |
| ⏸️ On Hold | Deliberately paused |
| ✅ Complete | Done, ready to archive |

## Write Rules

- Always read current state from MCP tools before writing anything.
- When updating hub notes, always **prepend** Status Log entries — never overwrite history.
- Never overwrite `## Key Decisions` without confirming with Sam first.
- Always assign Things tasks to the correct project and area with appropriate tags.
- Tasks belong in Things, not as checkboxes in Obsidian (unless in `## Next Steps` for visibility).

## Archiving

When a project is complete:
- Set status to `✅ Complete`
- Confirm with Sam before moving to `4. Archive/`
- Mark all open Things tasks as complete

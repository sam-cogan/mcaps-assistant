# Samples — Power-User Environments

> Real-world examples of MCAPS IQ users who built their own **second brain / personal agent** on top of this project.

Each subdirectory is a self-contained snapshot of a power user's customized environment — their instructions, skills, agents, prompts, and MCP server tweaks. Browse them for inspiration, copy what fits, and adapt it to your own workflow.

---

## Directory

| Sample | Role | Highlights |
|---|---|---|
| [`lenvolk/`](lenvolk/) | Solution Engineer (SE) | Full multi-agent orchestration, Outlook + Teams MCP servers, GHCP seat-adoption pipeline, OpenTelemetry monitoring |

---

## What's Inside a Sample

Each sample mirrors the customization surface of MCAPS IQ. You'll typically find:

```
samples/<user>/
├── .github/
│   ├── copilot-instructions.md   # Personalized system instructions
│   ├── instructions/             # Domain-specific instruction files
│   ├── skills/                   # Custom skills (SKILL.md per folder)
│   ├── agents/                   # Custom agent definitions (.agent.md)
│   ├── prompts/                  # One-click slash-command prompts (.prompt.md)
│   └── documents/                # Reference docs loaded on demand
├── .vscode/
│   └── settings.json             # VS Code / Copilot settings overrides
├── .connect/
│   └── hooks/                    # Connect evidence capture hooks
├── mcp/                          # Forked or extended MCP servers
│   ├── msx/
│   ├── outlook/
│   └── teams/
└── *.md                          # Strategy docs, optimization plans, etc.
```

Not every sample includes all of these — it depends on how far the user went.

---

## Featured: `lenvolk/` — Len Volk (Solution Engineer)

Len manages 35 customer accounts focused on driving GHCP seat adoption. His environment is the most comprehensive example of what's possible when you go all-in on customization.

### What he built

- **10 custom agents** — `AccountTracker`, `crm-operator`, `email-composer`, `browser-extractor`, `calendar-tracker`, and more, each scoped to a specific job.
- **22+ custom skills** — from `brainstorming/` and `pipeline-reviewer/` to `xlsx/` and `pdf/` processing, plus domain skills like `ghcp-seat-opportunity/` and `workiq-people-research/`.
- **12 slash-command prompts** — one-click workflows: `account-deep-dive`, `prepare-meeting`, `generate-weekly-plan`, `portfolio-snapshot`, `process-meeting-notes`, and others.
- **Extended MCP servers** — forked the MSX, Outlook, and Teams MCP servers with local modifications.
- **Detailed instruction files** — custom instructions for AI data competitive intelligence, tech sales strategy, GitHub Copilot billing analysis, and local Obsidian note routing.
- **6-phase optimization plan** — documented his iterative journey from a basic setup to a fully orchestrated personal agent system.
- **OpenTelemetry monitoring** — added Jaeger-based tracing to observe agent behavior in production use.

### Key takeaway

> The project's `.github/` customization surface (instructions, skills, agents, prompts) is the primary extension point. You don't need to fork the core — you layer your own intelligence on top.

---

## Contributing a Sample

If you've built a customized environment you'd like to share:

1. Create a new directory under `samples/` with your alias (e.g., `samples/yourname/`).
2. Include the `.github/` customization files that define your setup.
3. Add any extended MCP server code under `mcp/` if applicable.
4. **Scrub sensitive data** — remove account names, customer identifiers, API keys, and personal information.
5. Optionally include a short write-up (like an optimization plan) describing your journey and what problems you solved.
6. Submit a PR.

---

## Relationship to the Core Project

Samples are **reference material, not dependencies**. The core MCAPS IQ project (at the repo root) works out of the box without any of these. Samples show what's possible when you invest in making the agent truly yours.

For the official customization guide, see [Customization — Make It Yours](../README.md#customization--make-it-yours) in the main README.

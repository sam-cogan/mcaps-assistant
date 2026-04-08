---
applyTo: ".connect/hooks/**"
description: "Connect hook formatting + evidence schema, Obsidian vault routing for Connect evidence capture"
---
# Connect Hook Writing Guide

When writing Connect hooks:

- Use the schema below for every hook entry.
- Each hook must map to at least one **Connects impact area**.
- Include concrete evidence and a source pointer (PR / Issue / Doc / Thread / MSX record / M365 artifact).
- Keep each hook to **3–6 lines**.
- Every hook must have a **verifiable claim** backed by at least one primary source. Reject vague hooks — require specifics.

## Storage Routing

Connect hooks follow the vault-first storage pattern defined in `.github/instructions/obsidian-vault.instructions.md`.

**Summary:**
1. **Vault available**: Use `capture_connect_hook({ customer: "<CustomerName>", hook: { ... } })` to append to the customer's vault file under `## Connect Hooks`. The tool handles section creation if it doesn't exist.
2. **Always**: Write to `.connect/hooks/hooks.md` as a repo-tracked backup, regardless of vault availability.
3. **Vault unavailable**: `.connect/hooks/hooks.md` is the sole destination.

## Schema

```yaml
- Date:
- Impact Area(s): Customer Impact | Business Impact | Culture & Collaboration
- Hook:
- Evidence:
- Source:
- Next step:
```

## Connects Impact Area Definitions

| Impact Area | What qualifies |
|---|---|
| **Customer Impact** | Direct customer deliverable, adoption lift, milestone delivery, risk mitigation, solution readiness |
| **Business Impact** | Revenue influenced, pipeline progression, forecast accuracy, deal velocity, cost avoidance |
| **Culture & Collaboration** | Process improvement, tooling that scales, cross-team enablement, mentoring, knowledge sharing, inclusive practices |

## Attribution Gate (Mandatory)

Before writing any Connect hook, the agent **must** verify that the authenticated user has a demonstrable connection to the claimed impact:

1. **Resolve identity** — call `msx-crm:crm_whoami` to obtain the user's CRM `systemuserid` and alias.
2. **Check attribution** — the user must satisfy **at least one** of:
   - **(a) CRM owner** — the user is the `_ownerid_value` on the milestone or opportunity being cited.
   - **(b) Forecast participant** — the user's name or alias appears in the opportunity's forecast comments (`msp_forecastnotes`).
   - **(c) WorkIQ evidence participant** — the user's name or alias appears in the M365 evidence thread (email sender/recipient, meeting attendee, chat participant) retrieved via `ask_work_iq`.
3. **Fail-safe** — if attribution is inferred only from account-level activity (e.g., the user is on the account team but not named in any milestone, forecast, or communication evidence), the hook **must** be flagged:
   ```yaml
   - Evidence: "⚠️ Unverified — user not found in milestone/forecast/communication evidence. Confirm personal contribution before filing."
   ```
   Do **not** silently include account-level-only hooks as verified personal impact.

## Evidence Qualification

Only include evidence that meets **at least one** of:
- **Quantifiable impact** — revenue influenced, risk reduced, time saved, adoption unblocked
- **Decision-level influence** — architectural guidance, technical direction, tradeoff framing
- **Cross-team or customer leadership** — orchestration, alignment, unblocker behavior
- **Customer outcomes advanced** — milestone progression, solution readiness, delivery acceleration

Exclude: pure status updates with no outcome, administrative actions without impact, duplicative chatter.

## Team Updates Log — Primary Evidence Source

The vault file `3. Resources/Team Updates/Team Updates FY{XX}.md` (where `{XX}` is the fiscal year, e.g. `FY26`) contains a weekly log of all achievements and activity, organized by dated section headers (e.g. `W/C 16th February`).

**When building Connect hooks for a quarter or year:**

1. Read the team updates file using `oil:read_note({ path: "3. Resources/Team Updates/Team Updates FY{XX}.md" })`.
2. To scope to a quarter, read individual weekly sections that fall within the quarter's date range using the `section` parameter.
3. Extract concrete achievements, deliverables, and impact evidence from each week.
4. Cross-reference with CRM milestones and M365 evidence to enrich and verify claims.
5. Apply the attribution gate and evidence qualification rules above before writing hooks.

**FY quarter boundaries (approximate):**

| Quarter | Months |
|---------|--------|
| Q1 | July–September |
| Q2 | October–December |
| Q3 | January–March |
| Q4 | April–June |

## Example

```yaml
- Date: 2026-02-24
- Impact Area(s): Culture & Collaboration, Business Impact
- Hook: Built MCP-based CRM tooling that reduced milestone hygiene prep from ~45 min to <5 min per account
- Evidence: Weekly milestone review now automated; 3 CSAMs onboarded to the workflow
- Source: PR #42, recipe weekly-milestone-hygiene.md
- Next step: Expand to cover task-gap detection across full SE portfolio
```

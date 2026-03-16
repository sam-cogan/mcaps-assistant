---
description: "Shared definitions, runtime contract, upfront scoping pattern, WorkIQ companion, and output conventions used across all MSX/MCEM role workflows. Loaded when any role skill or MCEM flow skill activates. Prevents duplication across Specialist, SE, CSA, CSAM skills."
---
# Shared Patterns for MSX/MCEM Operations

## Shared Definitions

| Term                  | Definition                                                                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Opportunity** | Customer engagement container aligned to MCEM stages                                                                                                                     |
| **Milestone**   | Execution unit (`msp_engagementmilestones`) for commitment, delivery, and usage/consumption outcomes                                                                   |
| **Uncommitted** | Still shaping; not fully resourced for delivery (`msp_commitmentrecommendation ≠ 861980001`)                                                                          |
| **Committed**   | Customer agreement + internal readiness for execution (`msp_commitmentrecommendation = 861980001`)                                                                     |
| **Stage 1–5**  | MCEM stages: Listen & Consult → Inspire & Design → Empower & Achieve → Realize Value → Manage & Optimize                                                             |
| **EDE**         | Enhanced Designated Engineer — a dedicated technical resource aligned to a Unified Support package and customer TPID. Tracked in vault `## Unified Coverage`, not CRM |
| **Swarming**    | Cross-role collaboration on adjacent pipeline within the same account — working opportunities outside your direct assignment to bring full account value                |

## MCEM Unit → Agent Role Mapping

| MCEM Unit                   | Agent Roles                                              | Stage Accountability                  |
| --------------------------- | -------------------------------------------------------- | ------------------------------------- |
| ATU (Account Team Unit)     | Account Executive (out of scope for skills)              | Stage 1 lead, co-orchestrates Stage 2 |
| STU (Specialist Team Unit)  | **Specialist**, **Solution Engineer (SE)**   | Stages 2–3 accountable               |
| CSU (Customer Success Unit) | **CSAM**, **Cloud Solution Architect (CSA)** | Stages 4–5 accountable               |
| Partners                    | Referenced contextually                                  | Varies by segment and motion          |

## Runtime Contract

- **Read tools are live**: `msx-crm:crm_auth_status`, `msx-crm:crm_whoami`, `msx-crm:get_my_active_opportunities`, `msx-crm:list_accounts_by_tpid`, `msx-crm:list_opportunities`, `msx-crm:get_milestones`, `msx-crm:get_milestone_activities`, `msx-crm:crm_get_record`, `msx-crm:crm_query`, `msx-crm:get_task_status_options`.
- **Write-intent tools are dry-run**: `msx-crm:create_task`, `msx-crm:update_task`, `msx-crm:close_task`, `msx-crm:update_milestone` return `mock: true` preview payloads.
- **No approval-execution tools exposed yet**: treat write outputs as recommended operations pending future staged execution.
- Follow `msx-role-and-write-gate.instructions.md` for mandatory human confirmation before any write-intent operation.

## Upfront Scoping Pattern

Collect scope in minimal calls before per-milestone workflows:

0. **VAULT-PREFETCH** — call `oil:get_customer_context({ customer })` for opportunity GUIDs and context. Skip if OIL unavailable. See `obsidian-vault.instructions.md`.
1. **Prefer `get_milestones` with name resolution** — `msx-crm:get_milestones({ customerKeyword: "Contoso", statusFilter: "active" })` resolves customer → accounts → opportunities → milestones in one call. Add `includeTasks: true` to embed tasks inline.
2. **If vault provided GUIDs** — `msx-crm:get_milestones({ opportunityId })` or `msx-crm:get_milestones({ opportunityIds: [...] })` for batch.
3. `msx-crm:get_milestone_activities(milestoneId)` — only for specific milestones needing deep investigation (or use `includeTasks: true` above).
4. `msx-crm:crm_query` — for ad-hoc OData needs not covered by `get_milestones`. See `crm-query-strategy.instructions.md`.

## M365 Communication Layer

### Tool Selection: WorkIQ vs Native MCP

| Need | Tool | Skill |
|---|---|---|
| **Broad M365 discovery** (meetings + chats + emails + files) | `workiq:ask_work_iq` | `workiq-query-scoping` |
| **Targeted Teams retrieval** (specific chat, channel, message search) | `teams:*` | `teams-query-scoping` |
| **Targeted email retrieval** (KQL search, thread nav, attachments) | `mail:*` | `mail-query-scoping` |
| **Calendar operations** (schedule, availability, room booking) | `calendar:*` | `calendar-query-scoping` |
| **Send Teams message / post to channel** | `teams:PostMessage`, `teams:PostChannelMessage` | `teams-query-scoping` |
| **Send / reply / forward email** | `mail:SendEmailWithAttachments`, `mail:ReplyToMessage`, etc. | `mail-query-scoping` |
| **Create / manage calendar events** | `calendar:CreateEvent`, `calendar:UpdateEvent`, etc. | `calendar-query-scoping` |

**Decision rule**: Use WorkIQ for multi-source discovery ("what happened with Contoso this week?"). Use native MCP tools for targeted single-source operations ("find the email from satyan about the proposal", "post this to the project channel", "schedule a 30-min meeting").

### WorkIQ MCP Companion

Use `ask_work_iq` when evidence lives in M365 rather than CRM:

- **Sources**: Teams chats/channels, meeting transcripts/notes, Outlook mail/calendar, SharePoint/OneDrive docs.
- **Source separation**: CRM = system-of-record status; WorkIQ = communication and delivery evidence.
- **Scoping**: Always include explicit date range, customer/people, and source types. See `workiq-query-scoping/SKILL.md` for full playbook.
- **Personal attribution**: When gathering evidence for Connect or impact reporting, always include the authenticated user's name/alias (from `crm_whoami`) as a required filter. Account-level outcomes are not personal contributions unless the user appears in the evidence thread. See `workiq-query-scoping/SKILL.md` § Personal Attribution Filter.

### Native M365 MCP Tools

When using Teams, Mail, or Calendar MCP servers directly:

- **Teams**: Always set `top` on `SearchTeamsMessages` (start at 5-10). Self-chat (`48:notes`) is not discoverable via `ListChats`. Cache `teamId`/`channelId` after first resolution. **Vault-first UPN resolution**: Before any person-targeted Teams operation, call `oil:get_person_context({ name })` to retrieve cached `email`/`teamsId` — this avoids intermittent Graph API failures from direct UPN lookups. Persist newly discovered UPNs back to vault via `oil:patch_note`. See `teams-query-scoping/SKILL.md`.
- **Mail**: Always include date range in KQL searches. Use two-pass pattern (search → `GetMessage`). Check attachment sizes before download. See `mail-query-scoping/SKILL.md`.
- **Calendar**: Always use `ListCalendarView` (time-bounded), never `ListEvents` (unbounded). Resolve timezone first. See `calendar-query-scoping/SKILL.md`.

## VAULT-PROMOTE (Post-Workflow)

After completing a CRM workflow, persist validated findings to the vault:

- Use `oil:promote_findings()` or `oil:patch_note()` with `heading: "Agent Insights"`.
- If new opportunity GUIDs were discovered, use `oil:update_customer_file()` to add them.
- Skipped automatically if OIL is unavailable.

## Skill Composition Contract

### Cross-Service Data Flow Guardrails (RH-3)

The agent can read from one service and write to another in a single turn. To prevent unintended data flows:

**Expected cross-service read→write flows:**
| Read Source | Write Target | Example | Risk Level |
|---|---|---|---|
| CRM → Vault | Persist CRM insights to vault notes | `promote_findings` after milestone review | Low |
| M365 → Vault | Save meeting summaries or email evidence | `write_note` after WorkIQ retrieval | Low |
| CRM → CRM | Update milestones based on query results | Normal write workflow | Low |
| Vault → CRM | Use vault context to inform CRM writes | Vault-prefetch → milestone update | Low |

**Restricted cross-service flows (require explicit user confirmation):**
| Read Source | Write Target | Why Restricted |
|---|---|---|
| M365 email/chat → CRM fields | Communication content should not be injected into CRM records without review | Privacy/data classification mismatch |
| CRM → M365 (Teams/Mail send) | Pipeline or financial data should not be shared externally without review | HBI data exposure |
| Any external → CRM bulk writes | Multiple records affected | Data integrity risk |

**Agent behavior:**
- Single-turn read→write across services is allowed for expected flows.
- For restricted flows, always confirm with the user before executing.
- Never copy raw email/chat content into CRM fields without user approval.
- Write operations that include data from a different service must surface the data source in the staged response.

Skills are instruction documents auto-loaded by the runtime when matched, NOT exclusive tool calls. The agent MUST execute multiple skills sequentially in the same turn when the user's request requires outputs from more than one skill. Do NOT defer or refuse with "I can only invoke one skill at a time" — that constraint does not exist.

### How to execute a skill

1. **Locate**: The skill's Flow, Decision Logic, and Output Schema are already in your context when matched by the runtime. If a chained skill (via `next_action`) was not auto-loaded, fall back to `read_file` at `.github/skills/{name}/SKILL.md`.
2. **Execute**: Follow the skill's `## Flow` section — each numbered step maps to one or more MCP tool calls.
3. **Apply**: Use the skill's `## Decision Logic` and `## Output Schema` to classify results and structure output.
4. **Chain**: Read the skill's `next_action`. If the user's request spans the next skill, execute it immediately — do not ask permission.

### Multi-skill prompts

When a user prompt clearly requires multiple skills (e.g., "review adoption, check value realization, and flag expansion"):

1. Identify all required skills from the prompt — matched skills are already loaded.
2. Execute each skill's Flow sequentially, reusing MCP tool call results across skills where the same data is needed.
3. If any required skill was not auto-loaded (not in context), `read_file` it before executing.
4. Produce a combined output with sections labeled per skill.

### Composition rules

- **Same-role chaining**: When a skill's `next_action` names another skill owned by the same role, execute it immediately.
- **Cross-role chaining**: When `next_action` names a skill owned by a different role, present the handoff recommendation but do not block remaining same-role skills.
- **Parallel data gathering**: MCP tool calls that feed multiple skills (e.g., `get_milestones` used by both `milestone-health-review` and `mcem-stage-identification`) should be made once and reused.

### Common multi-skill chains

These chains are pre-validated. When a prompt matches a chain pattern, load and execute all listed skills:

| Chain name                           | Skills (in order)                                                                                                   | Trigger pattern                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Weekly pipeline review               | `pipeline-hygiene-triage` → `handoff-readiness-validation` → `risk-surfacing`                               | "weekly review", "pipeline cleanup + handoff + risks"                                       |
| Pre-governance prep                  | `mcem-stage-identification` → `milestone-health-review` → `customer-evidence-pack`                          | "governance meeting prep", "stage + health + evidence"                                      |
| Commit-or-loopback                   | `commit-gate-enforcement` → `non-linear-progression` → `delivery-accountability-mapping`                    | "should we commit or loop back"                                                             |
| Full deal triage                     | `mcem-stage-identification` → `exit-criteria-validation` → `risk-surfacing` → `role-orchestration`       | "deal stuck", "end-to-end triage"                                                           |
| Post-proof handoff                   | `architecture-feasibility-check` → `architecture-execution-handoff` → `handoff-readiness-validation`        | "proof completed, create handoff"                                                           |
| Adoption + expansion                 | `adoption-excellence-review` → `value-realization-pack` → `expansion-signal-routing`                        | "adoption health + value + expansion"                                                       |
| SE morning prep                      | `task-hygiene-flow` → `execution-monitoring` → `unified-constraint-check`                                   | "SE daily check", "task hygiene + blockers"                                                 |
| Account swarming                     | `account-landscape-awareness` → `account-structure-diagram` → `pipeline-hygiene-triage`                     | "what else is happening", "swarm opportunities", "full account view", "who else is working" |
| Unified investment scan              | `account-landscape-awareness` → `unified-constraint-check` → `pipeline-qualification`                       | "EDE gaps", "Unified upsell", "package coverage", "where should we invest"                  |
| Morning brief                        | `morning-brief` (parallel: vault + CRM + WorkIQ) → `pipeline-hygiene-triage` (optional drill-down)             | "morning brief", "start my day", "catch me up", "daily dashboard"                           |
| Proof cost modeling                  | `proof-plan-orchestration` → `azure-pricing-model` → `processing-spreadsheets`                              | "proof cost", "how much will this cost", "Azure pricing for POC"                            |
| Solution cost proposal               | `azure-pricing-model` → `processing-spreadsheets` → `value-realization-pack`                                | "cost model", "Azure pricing spreadsheet", "pricing document", "TCO comparison"             |
| PBI portfolio + CRM triage           | PBI prompt (subagent) → `pipeline-hygiene-triage` → `risk-surfacing`                                            | "review Azure portfolio and flag CRM actions", "gap to target + pipeline triage"            |
| PBI portfolio + WorkIQ               | PBI prompt (subagent) → WorkIQ scoped by report signals → `customer-evidence-pack`                                | "portfolio review + check recent comms", "what's happening with at-risk accounts"           |
| PBI + full deal triage               | PBI prompt (subagent) → `mcem-stage-identification` → `exit-criteria-validation` → `risk-surfacing`           | "portfolio review then triage stalled deals", "gap analysis + deal triage"                  |
| PBI navigator → portfolio           | `pbi-portfolio-navigator` → `pbi-azure-all-in-one-review` → `pipeline-hygiene-triage` → `risk-surfacing` | "am I on track", "gap to target", "show me my numbers"                                      |
| PBI navigator → service drill-down  | `pbi-portfolio-navigator` → `pbi-azure-service-deep-dive-sl5-aio`                                              | "where is my decline coming from", "service trends", "pillar breakdown"                     |
| PBI navigator → full manager review | `pbi-portfolio-navigator` → all 3 PBI prompts (subagent) → `pipeline-hygiene-triage` → `risk-surfacing`    | "full review", "manager review", "team performance", "give me everything"                   |
| PBI navigator → GHCP + portfolio    | `pbi-portfolio-navigator` → `pbi-azure-all-in-one-review` → `pbi-ghcp-new-logo-incentive`                   | "GHCP eligibility + portfolio gap", "incentive + attainment"                                |

**PBI chain rules** (see `pbi-context-bridge.instructions.md`):

- For medium/heavy PBI prompts, run PBI retrieval + analysis as a **subagent** so raw DAX data stays in the subagent's context. The parent receives only the final rendered report.
- PBI reports are persisted to `.copilot/sessions/pbi/` for downstream re-read without re-executing queries.
- Downstream skills scope their CRM/WorkIQ queries using the report's gap analysis table, conversion rankings, and recommended actions.

## Connect Hook Capture (Post-Action)

After completing any skill that produces measurable outcomes, the agent **passively evaluates** whether the work constitutes impact evidence worth capturing for Microsoft Connects performance reviews.

### When to fire

Fire `oil:capture_connect_hook` when a completed skill produced at least one of:

- A **concrete deliverable** (health report, exception list, handoff document, remediation plan)
- A **measurable improvement** (time saved, errors fixed, milestones unblocked, adoption gaps closed)
- A **process contribution** (new tooling, documentation, onboarding others, cross-team enablement)

Do **not** fire for: pure read/discovery actions, failed scoping attempts, or skills that produced no actionable output.

### Impact area classification

| Impact Area                       | Skill output signals                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Customer Impact**         | Direct customer deliverable, adoption lift, milestone delivery, risk mitigation, solution readiness                                    |
| **Business Impact**         | Revenue influenced, pipeline progression, forecast accuracy, deal velocity, cost avoidance                                             |
| **Culture & Collaboration** | Process improvement, tooling that scales beyond one person, cross-role coordination, mentoring, knowledge sharing, inclusive practices |

Most skill completions map to **Customer Impact**. Add **Business Impact** when the action influenced pipeline or revenue. Add **Culture & Collaboration** when the action created reusable process, enabled cross-team work, or involved mentoring.

### Capture pattern

After the skill's output is delivered, if a hook is warranted:

1. Derive `customer` from the skill's scoping context (opportunity or vault prefetch).
2. Build `hook` from the skill's structured output — the hook text should be the one-sentence impact summary, evidence from the measurable delta, and source from the skill invocation or CRM record.
3. Call `oil:capture_connect_hook({ customer, hook })`. This is auto-confirmed — no human gate.
4. If OIL is unavailable, skip silently. The hook is opportunistic, not blocking.

Skills may include a `connect_hook_hint` in their Output Schema to pre-classify the likely impact area(s) and hook template. When present, the agent uses the hint to streamline capture. When absent, the agent applies the classification table above.

## Common Output Conventions

- Dry-run write payloads include `mock: true` and the tool name that would execute.
- Every stage-bound skill output includes `next_action` naming the recommended next skill.
- Cross-role `next_action` must name the owning role and recommend engagement (no auto-invoke).
- Risk findings always include: one-sentence risk, evidence source, role to act, minimum intervention.
- `connect_hook_hint` (optional): pre-classified Connects impact area(s) and one-line hook template for passive evidence capture.

### CRM Record Linkification (Mandatory)

Whenever displaying milestones, opportunities, or tasks from MSX CRM, **always include a clickable link** to the CRM record. This applies to all output formats — tables, lists, confirmation packets, health reports, and triage summaries.

**URL pattern:**

```
https://microsoftsales.crm.dynamics.com/main.aspx?etn=<entityLogicalName>&id=<GUID>&pagetype=entityrecord
```

| Entity      | `etn` value               | GUID source                                                     |
| ----------- | --------------------------- | --------------------------------------------------------------- |
| Opportunity | `opportunity`             | `opportunityid`                                               |
| Milestone   | `msp_engagementmilestone` | `msp_engagementmilestoneid` or `id` from `get_milestones` |
| Task        | `task`                    | `activityid`                                                  |

**Rendering rules:**

- If `get_milestones` returns a `recordUrl` field, use it directly — do not reconstruct.
- Format as a markdown link with the record name as display text: `[Milestone Name](url)`.
- In tables, use a dedicated "Link" column or make the name column itself a link.
- In confirmation packets and write-gate output, every milestone and task must be linked.
- For tasks, construct the URL from `activityid` when `recordUrl` is not provided: `https://microsoftsales.crm.dynamics.com/main.aspx?etn=task&id=<activityid>&pagetype=entityrecord`.

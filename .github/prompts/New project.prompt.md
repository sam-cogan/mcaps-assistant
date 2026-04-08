---
name: New Project
description: Kick off a new project — create Obsidian hub note and Things project from a brain dump
tools:
  - oil/*
  - things/*
---

I need to set up a new project. Here's my brain dump:

${input:brainDump}

From this, extract the following and confirm back to me before creating anything:

- **Project name** — what to call it in both Obsidian and Things
- **Type** — Customer Engagement / Internal / Learning / Community
- **Customer/organisation** — if applicable
- **Things area** — Customer Work / CSA Work / Community / Admin
- **Key goal** — one sentence
- **Known tasks** — list of initial todos you can infer
- **Deadlines** — any dates mentioned or implied

Once I confirm, do the following:

1. Create the Obsidian hub note at `1. Projects/{Name}/{Name}.md` using this exact structure:

```
---
status: 🟡 Active
type: {type}
customer: {customer}
started: {today}
last-reviewed: {today}
next-action: {first logical next action}
owner: Sam
things-project: {Things project name}
---

[dataview table block]

# {Name}

## Overview
{2-3 sentence summary}

## Current Status
Project initiated.

## Blockers & Risks
None identified.

## Next Steps
{checkbox list of initial tasks}

## Key Decisions
{any decisions already made from the brain dump}

## Status Log
### {today}
- Project created
{any key context from the brain dump}
```

2. Create a matching Things project in the correct area
3. Add the initial tasks to Things with appropriate tags (`@deep-work` for focused tasks, size tags where obvious) and any known deadlines or scheduled dates
4. Confirm everything that was created
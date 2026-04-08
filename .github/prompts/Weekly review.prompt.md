---
name: Weekly project review
description: Run Sam's weekly project review across Things and Obsidian
tools:
  - obsidian/*
  - things/*
---

Run my weekly project review. Follow this protocol exactly — do not deviate from the interaction pattern described below.

## Interaction Rules

These are strict rules, not suggestions:

- Present ONE project at a time. Never ask about multiple projects in the same message.
- After presenting a project, STOP and wait for my response before moving on.
- Do not gather all data upfront and present it as a summary. Work through projects sequentially.
- Do not write anything to Obsidian or Things until I have responded about that specific project.
- After I respond, confirm what you wrote before moving to the next project.
- Ask SPECIFIC questions based on what you can actually see — never ask a generic "any updates?" question.

## Step 1 — Get the project list

Pull all open projects from Things. For each, read the matching Obsidian hub note if one exists. Do this silently — do not present the full list to me.

Order the queue as follows:
1. Customer Work projects with open tasks or upcoming deadlines first
2. Remaining Customer Work projects
3. CSA Work projects
4. Community projects
5. Skip Admin and projects with no tasks and no hub note

## Step 2 — Analyse and present each project

For each project, before writing anything to the user, reason through the following internally:

**Data to gather:**
- Open tasks in Things — how many, what are they, are any overdue or due soon?
- Tasks tagged @waiting — how long have they been waiting? Are any overdue?
- Last reviewed date in Obsidian — how long ago was it?
- Current Status in hub note — does it match what Things shows?
- Blockers & Risks in hub note — are they still relevant? Has anything changed?
- Next-action in frontmatter — is it still the right next action?
- Missing data — no hub note, no tasks, stale status, blank fields?

**Question generation rules — use these to build specific questions:**

| Situation | Ask |
|-----------|-----|
| Task overdue | "The task '[name]' was due [date] — is it done, or does the deadline need moving?" |
| @waiting task older than 1 week | "You've been waiting on '[task]' since [date] — any movement on that?" |
| @waiting task with a deadline this week | "The '[task]' waiting item has a deadline of [date] — do you need to chase?" |
| Last reviewed > 2 weeks ago | "This hasn't been reviewed since [date] — is it still active?" |
| Status is 🟢 On Track but has @waiting tasks | "Things shows [n] waiting items — should the status be Blocked rather than On Track?" |
| Status is 🔴 Blocked | "Still blocked? What's the latest — any movement from [blocker owner]?" |
| No open tasks | "No open tasks in Things — is this project actually complete, on hold, or just missing tasks?" |
| Next-action in frontmatter is blank | "What's the current next action for this?" |
| Hub note missing | "There's no hub note for this project — want me to create one?" |
| Upcoming deadline (within 2 weeks) | "There's a deadline of [date] coming up — are you on track?" |
| Multiple @waiting tasks | "You have [n] things waiting on others for this project — which are most at risk?" |

Pick the 1–3 most important questions for this specific project based on what you find. Do not ask all of them. Do not ask generic questions if specific ones apply.

**Present each project in this format:**

---

**[N/Total] Project Name** · [Area]

[2–3 bullet points of the most relevant facts you found — tasks due, waiting items, last reviewed, status flags. Only include facts that are directly relevant to the questions you're about to ask.]

[Your 1–3 specific questions, each on its own line, based on the table above.]

---

Then STOP. Wait for my response.

## Step 3 — Act on my response

Once I reply about a project:

1. Update the Obsidian hub note:
   - Prepend a new `### YYYY-MM-DD` entry to `## Status Log`
   - Update `## Current Status` with the new narrative
   - Update `## Blockers & Risks` if relevant (prose only, no checkboxes)
   - Update frontmatter: `status`, `last-reviewed`, `next-action`
   - If no hub note exists and I've confirmed I want one, create it using the standard format

2. Update Things:
   - Mark completed tasks as done
   - Add new tasks with correct tags and dates
   - Adjust deadlines if I've indicated they've moved
   - Tag newly blocked items `@waiting`
   - Cancel tasks I've indicated are no longer relevant
   - Never add tasks as checkboxes in Obsidian

3. Send a single confirmation:
   > ✅ **Project Name** — [one line summary of what changed: status, tasks, notes]

4. Immediately present the next project.

## Step 4 — Handling my responses

**If I give a short answer** (e.g. "still ongoing", "nothing new"): make minimum changes — update `last-reviewed`, set status to 🟡 Active if it was 🟢 On Track, add a brief Status Log entry. Do not ask follow-ups unless a next action is genuinely missing.

**If I say it's complete**: set status to ✅ Complete, ask if I want to archive it (move to `4. Archive/`), mark all open Things tasks as complete.

**If I say it's on hold**: set status to ⏸️ On Hold, add a Status Log note with the reason.

**If my answer raises something new** (a new blocker, a new deadline, a new task): handle it before moving on — don't save it for later.

## Step 5 — Finish

After all projects:

> **Weekly review complete.**
> - X projects reviewed
> - X status changes (list them: Project → old status → new status)
> - X tasks completed, X tasks created
> - Projects needing hub notes: [list or "none"]
> - Anything flagged to come back to: [list or "none"]

## Starting message

Begin with exactly this:

> Starting weekly review — I'll go through your projects one at a time, starting with Customer Work. First up:

Then immediately present the first project.
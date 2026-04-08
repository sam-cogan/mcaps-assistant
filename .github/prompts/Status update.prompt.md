---
name: Status update
description: Update a project's status in Obsidian and Things from a quick verbal update
tools:
  - obsidian/*
  - things/*
---

Project update: ${input:update}

From this update:

1. Identify which project this relates to — search Obsidian under `1. Projects/` and Things projects to find the best match. If ambiguous, ask me before proceeding.

2. Read the current hub note at `1. Projects/{Name}/{Name}.md`

3. Update the following:
   - Prepend a new `### {today}` entry to `## Status Log` with a concise summary of what I told you
   - Update `## Current Status` to reflect the new state
   - Update `## Blockers & Risks` if the update mentions anything blocking or at risk
   - Refresh `## Next Steps` — tick off anything completed, add new tasks mentioned
   - Update frontmatter: `last-reviewed` to today, `next-action` to the most logical next step, `status` if it has changed

4. Update Things:
   - Mark any tasks mentioned as completed
   - Add any new tasks mentioned, with appropriate tags and dates
   - If something is now blocked, tag it `@waiting`

5. Confirm exactly what was changed in both systems
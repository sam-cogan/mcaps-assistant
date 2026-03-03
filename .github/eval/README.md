# Skill Routing Evaluation

Static analysis framework that measures how well VS Code Copilot's skill routing
matches user queries to the correct skill files, comparing the **monolithic** (main)
architecture against the **atomic** (branch) architecture.

## How it works

1. Loads skill file frontmatter (`name`, `description`, `argument-hint`) from both architectures
2. Computes sentence embeddings for every skill description and every test query
3. Ranks skills by cosine similarity for each query
4. Compares rankings against expected results → Precision, Recall, F1, MRR
5. Reports context budget (lines loaded) per architecture

**Model**: `Xenova/all-MiniLM-L6-v2` (~23 MB, runs locally via `@xenova/transformers`)

## Quick start

```bash
cd .github/eval
npm install          # first time only
npm run eval         # compare both architectures (default)
```

## Commands

| Command | Description |
|---|---|
| `npm run eval` | Compare main vs branch (side-by-side) |
| `npm run eval:main` | Evaluate main (monolithic) only |
| `npm run eval:branch` | Evaluate branch (atomic) only |
| `npm run eval:compare` | Same as `npm run eval` |
| `npm run sweep` | Threshold sensitivity sweep (0.20–0.50) |
| `npm run confusion` | Pairwise skill similarity / confusion matrix |
| `npm run lint` | Description quality linter (branch skills) |
| `npm run lint:all` | Lint branch + legacy skills |
| `npm run all` | Run eval + sweep + confusion + lint in sequence |

## Configuration

| Env var | Default | Description |
|---|---|---|
| `THRESHOLD` | `0.35` | Minimum cosine similarity to count a skill as "selected" |
| `TOP_K` | `5` | Max skills shown per test case |

Example: `THRESHOLD=0.40 TOP_K=3 npm run eval`

## Metrics

| Metric | Meaning |
|---|---|
| **Precision** | Fraction of selected skills that are expected |
| **Recall** | Fraction of expected skills that were selected |
| **F1** | Harmonic mean of Precision and Recall |
| **MRR** | Mean Reciprocal Rank — how quickly the first expected skill appears |
| **Lines loaded** | Total lines across all selected skills (context budget proxy) |

## Output symbols

- `✓` — expected skill, above threshold (true positive)
- `●` — above threshold but not in expected list
- ` ` — below threshold

## Test case categories

| Category | IDs | What it tests |
|---|---|---|
| Role-specific | `csam-*`, `se-*`, `spec-*`, `csa-*` | Correct skill for a known role + stage |
| Multi-skill | `multi-*` | Query should trigger >1 skill |
| Negative | `neg-*` | Off-topic query → 0 skills selected |
| Ambiguous | `ambig-*` | Role-neutral query → best-match routing |
| Confusion | `confuse-*` | Adjacent-skill discrimination |
| Semantic | `semantic-*` | No keyword overlap → pure semantic match |

## Threshold sweep

```bash
npm run sweep                 # default: 0.20–0.50, step 0.05
node threshold-sweep.mjs 0.25 0.45 0.05  # custom range
```

Outputs a table showing how Precision/Recall/F1 change at each threshold
for both architectures. Use this to find the optimal operating point.

## Confusion matrix

```bash
npm run confusion             # default warn threshold: 0.55
node confusion-matrix.mjs --warn 0.50  # custom
```

Computes pairwise cosine similarity between all skill descriptions.
High-similarity pairs (above `--warn`) are flagged as confusion risks.

## Description linter

```bash
npm run lint                  # branch skills only
npm run lint:all              # branch + legacy
```

Checks: missing fields, description length, keyword density, token overlap.

## Adding test cases

Edit `test-cases.yaml`. Each case needs:

```yaml
- id: unique-slug
  query: "Natural language user query"
  role: CSAM | CSA | SE | Specialist | any
  stage: 1-5 | any
  expected:
    main: [MonolithicFile_SKILL.md]
    branch: [atomic-skill-SKILL.md]
  not_expected_branch:          # optional — flags false positives
    - unrelated-skill-SKILL.md
```

## Limitations

- Embedding similarity is a **proxy** for VS Code's actual routing algorithm
- Does not test `applyTo` glob matching (Tier 1 instructions)
- Model quality affects results; different models may yield different rankings
- Threshold tuning required; 0.35 is a reasonable starting point for MiniLM

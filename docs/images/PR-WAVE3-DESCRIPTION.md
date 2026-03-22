# PR Description — Wave 3

Used as the body for the GitHub PR. Delete this file after PR creation.

---

![Wave 3: App Creation Pipeline](https://raw.githubusercontent.com/SethGammon/Citadel/dev/docs/images/pr-wave3-hero.png)

## What this is

The integration layer between "I want an app" and a verified, working application. Every existing tool either generates fast with no verification (Bolt, v0, Lovable) or runs autonomously with no guardrails (Devin, Replit Agent). This is the first system that does both: structured generation with phase-by-phase verification, self-correction loops, and circuit breakers that park work instead of burning tokens.

Three new skills form a pipeline. Each produces a document that the next one consumes.

## 3 New Skills

![The Pipeline](https://raw.githubusercontent.com/SethGammon/Citadel/dev/docs/images/pr-pipeline.png)

| Skill | What It Produces | Invoke |
|---|---|---|
| **PRD** | Structured requirements doc with machine-verifiable end conditions | `/prd` |
| **Architect** | File tree, component breakdown, phased build plan with end conditions | `/architect` |
| **Create App** | End-to-end orchestration: PRD → Architecture → Archon campaign → Verification | `/create-app` |

Each skill works independently (`/prd` for just a spec, `/architect` for just a plan) or chained through `/create-app` for the full pipeline.

## 5 Tiers of Autonomy

![5 Tiers](https://raw.githubusercontent.com/SethGammon/Citadel/dev/docs/images/pr-tiers.png)

| Tier | Name | Human Checkpoints | Use When |
|---|---|---|---|
| 1 | **Blank** | 0 | You know what you're building, just want scaffolding |
| 2 | **Guided** | 3 (PRD, architecture, each phase) | You have an idea but need help structuring it |
| 3 | **Templated** | 2 (PRD review, architecture review) | Well-known app type (todo, blog, dashboard) |
| 4 | **Generated** | 1 (PRD approval only) | Detailed description, trust the pipeline |
| 5 | **Feature** | 1 (feature spec approval) | Adding to an existing codebase |

The user chooses how much control to keep. The system never chooses for them.

## Feature Mode (Tier 5)

The biggest gap in existing app creation tools: they all assume greenfield. Tier 5 adds features to existing codebases.

```
/do add auth to my app
```

The pipeline reads your existing codebase first, then:
- **PRD** scopes to the feature, not a whole app. Existing stack is inherited, not re-evaluated.
- **Architect** shows only new and modified files. Phase 0 records your current typecheck/test baseline.
- **Every phase** includes regression checks: "no new typecheck errors" + "existing tests pass."

## Machine-Verifiable End Conditions

The structural differentiator. Every phase has acceptance criteria that Archon checks before marking complete:

| Type | Example |
|---|---|
| `file_exists` | `src/auth/middleware.ts` exists |
| `command_passes` | `npx tsc --noEmit` exits 0 |
| `metric_threshold` | `npm test -- --coverage` > 60% |
| `visual_verify` | Dashboard renders with data (via `/live-preview`) |
| `manual` | User confirms auth flow works end-to-end |

This closes the "80% wall" — the pattern where tools build most of an app but can't finish. Each phase is either done (conditions pass) or not done (conditions fail). No ambiguity.

## Research Basis

A 5-scout research fleet analyzed 11 existing tools, 8 academic papers, and developer community feedback to identify what works, what breaks, and what nobody has solved:

- **Consensus**: "Single prompt to complete app" is marketing. Every tool that works uses multi-step decomposition.
- **The gap**: No system connects planning → execution → verification in a persistent pipeline with machine-verifiable acceptance criteria.
- **Key insight**: The winning pattern is Plan → Review → Execute with external verification between steps — not single-shot generation.

## By the Numbers

| Metric | Before | After |
|---|---|---|
| Skills | 18 | **21** |
| App creation tiers | 0 | **5** |
| Codebase modes | Greenfield only | **Greenfield + Feature** |
| End condition types | 0 | **5** (file, command, metric, visual, manual) |
| App type templates | 0 | **3** (CRUD, Landing Page, API with Auth) |

## What's Next

- On-ramp polish: progressive disclosure based on user experience level
- More app-type templates as patterns emerge from real usage
- Build report at completion: file paths + concept mapping

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

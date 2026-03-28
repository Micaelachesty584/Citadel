# citadel Rubric — Level 1 Final State

> Date: 2026-03-28
> Loops completed at this level: 3 (loop-1 security_posture, loop-2 onboarding_friction, loop-3 documentation_accuracy)
> Triggered by: manual --level-up flag (not distribution saturation)
> Note: with min aggregation applied, several axes have significant remaining gap. The level-up
> is intentional — to re-anchor the ceiling before continuing — not because the floor has been extracted.

## Final Scorecard (min aggregation)

| Axis | A | B | C | Final (min) | Level 1 Ceiling (10 anchor) |
|------|---|---|---|-------------|------------------------------|
| test_coverage | 9 | 9 | 9 | **9** | Every hook has smoke+integration tests; every skill has benchmarks; suite runs in <60s |
| documentation_accuracy | 8 | 8 | 8 | **8** | Every claim verifiable; every path exists; docs/source cross-checked |
| api_surface_consistency | 8 | 8 | 9 | **8** | Identical five-section format; uniform frontmatter; every HANDOFF block present |
| competitive_feature_coverage | 8 | 8 | 8 | **8** | Every competitor feature addressed: implemented, scoped out, or on roadmap |
| visual_coherence | 9 | 8 | 8 | **8** | All visuals share palette, typography, motifs; design manifest exists |
| security_posture | 9 | 8 | 9 | **8** | execFileSync everywhere; .env blocked all paths; audit log; no known bypasses |
| hook_reliability | 8 | 9 | 9 | **8** | All lifecycle events covered; fail-closed; malformed input handled; <5s on large repos |
| onboarding_friction | 9 | 6 | 8 | **6** | clone→setup→first /do review in <3 min; zero errors; user thinks "I need this" |
| demo_page_effectiveness | 8 | 6 | 8 | **6** | "I need to try this" reaction; live input; <2s load; one CTA; mobile-clean |
| command_discoverability | 8 | 7 | 9 | **7** | /do routes natural language; user never needs to know skill names; intent groups |
| documentation_coverage | 8 | 7 | 8 | **7** | Every skill has example; every hook has "what you'll see"; worked campaign example |
| differentiation_clarity | 9 | 7 | 7 | **7** | 30 seconds: reader can explain to colleague what Citadel does CLAUDE.md doesn't |
| readme_quality | 9 | 7 | 9 | **7** | Best single page; visual hierarchy; ≤5 steps; shows don't tell; developer wants to star |
| error_recovery | 7 | 5 | 7 | **5** | Every error: what happened, why, what to do next; stale state auto-cleaned; no source-reading required |

## Axes at Level 1 ceiling (≥ 9)
- test_coverage (9): structural ceiling — every meaningful test is written. Level 2 version requires semantic correctness testing, not more structural coverage.

## Axes with significant remaining Level 1 gap
These would have been the next targets if saturation had been allowed to run:
- error_recovery (5): large gap, high weight. The newcomer (B=5) can't recover from failures without reading source. Concrete error messages and auto-recovery are missing.
- onboarding_friction (6): B=6 indicates the hook install step and "known bug" framing still create friction.
- demo_page_effectiveness (6): B=6 — demo is beautiful but doesn't create desire to install. Visitor understands capability without feeling the value.
- differentiation_clarity (7): B and C both scored 7. The "why Citadel over alternatives" is not landing for non-builders.
- readme_quality (7): B=7. Written for people who already feel the pain. Cold visitors don't connect.

## What this level established
- The system can score itself, select improvements, and execute them correctly.
- Aggregation method matters: median was hiding B's 5 on error_recovery and 6 on demo/onboarding.
- The improve loop's own process axes (decomposition_quality, scope_appropriateness, verification_depth) were not measured — they can't self-report. Level 2 makes this explicit.
- Behavioral simulation was specified but never run due to environment constraints (Windows + temp directory). This is the largest Level 1 gap in verification quality.

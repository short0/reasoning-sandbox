
# Reasoning Lab — Build Plan

A calm, minimalist web app that teaches when reasoning models help and lets users explore the task → fast answer → reasoning answer → critique → revision flow with mocked outputs by default.

## Information architecture

- `/` — **Home**: hero, "How it works" (4-step visual), preset cards, CTA to open the Lab.
- `/lab` — **Lab**: 3-panel workspace (input + presets, side-by-side outputs, critique/score/revision).
- `/about` — **About reasoning**: short primer on when to use reasoning vs fast models, with examples.

Shared header with logo, nav, theme toggle, and "Reset" action.

## Home screen

- Hero: one-line value prop + sub-headline in plain language ("See when a model should think harder — and when it shouldn't").
- Two CTAs: **Try a preset** (scrolls to cards) and **Open blank lab**.
- **How it works** strip: 4 labeled steps (Task → Fast answer → Critique → Revision) with subtle icons.
- **Presets** grid (4 cards): title, one-line description, difficulty tag, "Launch" button. Clicking loads the preset directly into `/lab`.
- Footer note explaining mocked-mode default.

## Lab screen — layout

**Desktop (3 panels):**
- Left (≈22%): Preset picker dropdown, task textarea, **Mode toggle** (Mocked / Live — Live disabled by default with a "Coming soon / requires key" hint), settings (reasoning depth slider, show critique toggle), Run button, Undo / Redo / Reset row.
- Center (≈48%): Two stacked cards — **Fast answer** and **Reasoning answer** — each with a label chip, latency/token mock stats, and copy button. A diff-style highlight shows where they differ.
- Right (≈30%): **Critique** card (bullet findings), **Scorecard** (Accuracy / Reasoning / Clarity / Completeness — 0–10 bars), **Revised final answer** card, and an **"Explain this result"** expandable section in beginner language.

**Tablet:** left panel collapses into a top bar; center and right become two columns.
**Mobile:** fully stacked; sticky top action bar with Run, Mode, Undo/Redo, Reset; sections in tabs (Inputs / Outputs / Critique).

A persistent **"Simulated mode"** badge appears in the header whenever Mocked mode is active; a different colored badge indicates Live mode.

## Presets (preloaded content)

Each ships with task, fast answer, reasoning answer, critique, scorecard, revised answer, and 3–5 quick-action prompts:

1. **Multi-step Math Problem** — word problem where fast answer skips a step; reasoning shows work.
2. **Buggy Code Review** — JS snippet with an off-by-one + async bug; fast answer misses one, reasoning catches both.
3. **Contract Clause Analysis** — ambiguous indemnity clause; reasoning surfaces edge cases.
4. **Judge Two Competing Answers** — picks a winner with rubric-based justification.

Quick-action chips under the task input let users swap in variant prompts instantly.

## Interactions & state

- **Run** simulates latency (300ms fast / ~1.5s reasoning with a subtle progress shimmer) then reveals outputs progressively (fast → reasoning → critique → revision) so the pipeline is visible.
- **Replay run** button re-animates the reveal for teaching.
- **Undo / Redo** stack covers: preset change, task edit, settings change, run, reset session. Keyboard shortcuts: ⌘Z / ⇧⌘Z.
- **Reset to home** clears current session state but keeps presets, theme, and history list.
- **Recent runs** list (last 10) in left panel for quick re-open.
- **Notes** field per session, autosaved.

## Persistence (localStorage)

Single namespaced key storing: theme, current session (task, mode, settings, outputs), recent runs, notes, last preset, undo/redo stacks (capped).

## Optional live mode

Toggle in left panel labeled **Advanced**. When enabled, shows a small inline form to paste an API key (stored only in localStorage with a clear warning) and a provider dropdown. If no key, the toggle is disabled with tooltip "Add a key to enable Live mode." Mocked mode remains the polished default and all presets work without it.

## Design system

- Light mode default; dark mode toggle persisted.
- Neutral palette (warm off-white background in light, deep slate in dark), single restrained accent for primary actions.
- Generous spacing, 1px subtle borders, soft shadows on cards only on hover, rounded-lg corners.
- Typography: clean sans for UI, mono for code/answer blocks. Clear hierarchy with restrained sizes.
- Inline labels (small uppercase chips) on every output block: TASK, FAST ANSWER, REASONING, CRITIQUE, SCORE, FINAL.

## Accessibility

- Full keyboard nav, visible focus rings, ARIA labels on toggles and panels, 44px tap targets on mobile, AA contrast in both themes, reduced-motion respected for reveal animations.

## Out of scope (v1)

- Real authentication, server-side storage, multi-user sharing, exporting runs as files (can be added later).

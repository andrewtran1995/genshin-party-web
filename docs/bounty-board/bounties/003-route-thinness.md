---
id: 003
title: Logic drifting out of $lib and into components
status: open
size: M
last-run: 2026-08-31
runs: 1
---

# Logic drifting out of `$lib` and into components

## Why this matters

`AGENTS.md` asks for thin route files with logic in `$lib`, and for flat component hierarchies. The
line has bent: `src/routes/char/+page.svelte` is 145 lines, and `CardChrome.svelte` is 450 — big
enough that the rules it encodes are only discoverable by reading it. Logic living in a `.svelte`
file is logic the node test project cannot reach, so it drags bounty 001 down with it: the only way
to test it is a browser test that renders the whole component.

## Scope

**In:** extracting pure logic out of `.svelte` files into `$lib` modules, splitting a component whose
responsibilities have visibly diverged, and deleting indirection that no longer earns its place.

**Out:** visual or behavioural change of any kind. A slice under this bounty should be provable by
its tests passing unchanged before and after.

## Exit criteria

- [ ] No file under `src/routes/` exceeds 100 lines. Still violated by `src/routes/+page.svelte`
      (121) and `src/routes/char/[name]/+page.svelte` (140); see findings log.
- [ ] No component under `src/lib/components/` exceeds 250 lines. Still violated by `BossCard.svelte`
      (251), `CharCard.svelte` (284), `PresetManager.svelte` (286), `InteractiveFlow.svelte` (329),
      and `CardChrome.svelte` (450) — none touched this run.
- [ ] Every branch rule that decides _what_ is shown (as opposed to _how_) lives in a `$lib` module
      with a node-project test.

## Guardrails

Composition over abstraction, per `AGENTS.md`. Extracting a helper used once, or introducing a layer
whose only job is to forward props, makes the code worse and satisfies the line counts anyway —
these criteria are a symptom to chase, not a target to hit. If a slice cannot reduce a file without
adding an abstraction nobody asked for, log that in the findings and leave the file alone.

## Findings log

- 2026-08-31: `src/routes/char/+page.svelte` (145 lines) visibly mixed two responsibilities: the
  main "roll a random character" form and an unrelated debug tool ("view every card variant for one
  named character") with its own state, its own submit handler, and its own validation error. Split
  the debug tool into `src/lib/components/CharacterDebugPanel.svelte` — a real component with its own
  logic and markup, not a prop-forwarding wrapper, so it clears the guardrail against hollow
  extraction. The route now imports it and passes `characters`/`error` as data. Route file is down to
  93 lines (under the 100-line criterion); the new component is 64 lines. No `$lib` module was
  touched — both handlers are DOM/navigation glue (`FormData`, `goto`), not branch rules deciding
  what to show, so the third exit criterion doesn't apply to this slice. Verified behaviour-unchanged
  by running the existing Playwright specs that already cover both forms
  (`e2e/no-js.spec.ts:9,17,33,42`, `e2e/rolls.spec.ts:9,31`) against the built app before and after —
  all six passed unchanged; the only other e2e failure in the suite (`no-js.spec.ts:52`, a boss-route
  404 for a comma-containing name) is bounty 007's known issue, already tracked in its own open PR,
  and untouched by this change.
  - Surveyed every file against both line-count criteria (see exit criteria above for the current
    violation list). Left `src/routes/+page.svelte` (121) and `char/[name]/+page.svelte` (140) alone
    this run — one slice per run, and `char/+page.svelte` was the file this bounty's own "why this
    matters" section named.
  - Did not attempt `CardChrome.svelte` (450 lines) or the other oversized components this run: each
    needs its own reading to find a genuine responsibility split rather than a mechanical line cut,
    and is a bigger slice than one PR.

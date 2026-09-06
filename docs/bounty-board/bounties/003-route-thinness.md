---
id: 003
title: Logic drifting out of $lib and into components
status: open
size: M
last-run: 2026-09-03
runs: 2
---

# Logic drifting out of `$lib` and into components

## Why this matters

`AGENTS.md` asks for thin route files with logic in `$lib`, and for flat component hierarchies. The
line has bent: `src/routes/char/+page.svelte` is 108 lines, and `CardChrome.svelte` is 450 — big
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
      (121, almost entirely CSS — see findings log); `src/routes/char/[name]/+page.svelte` is now 95.
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

- 2026-09-03: Took `src/routes/char/[name]/+page.svelte` (145 lines then; the exit criteria listed it
  as 140 from a slightly earlier count). Two `$derived` values there were branch rules deciding _what_
  to show, not DOM/navigation glue: `appliedFilters` (turns the active element/rarity/forced-variant
  into display labels) and `mismatch` (whether the rolled character actually satisfies the requested
  filters). Moved both to `$lib/genshin/characters.ts` as `charFilterLabels` and
  `charMismatchesFilters`, each with its own node-project unit tests in `characters.test.ts` — this
  clears the third exit criterion for this file. Separately, the route's `{#if allVariants}` branch
  (the same debug/gallery view the previous run split out of `char/+page.svelte`) was inline markup
  and CSS with no counterpart in `$lib`; extracted it into
  `src/lib/components/CharVariantGallery.svelte`, a real component (its own markup, its own iteration
  over `cardVariants`, its own styles), not a prop-forwarding wrapper. Route file is now 95 lines
  (under the 100-line criterion); `CharVariantGallery.svelte` is 56. `pnpm lint`, `pnpm check`, and
  `pnpm test:unit --run` all pass (198 unit tests, up from 190). Could not run the Playwright specs
  that exercise this route (`e2e/rolls.spec.ts:31`, `e2e/no-js.spec.ts:17`) locally — this checkout's
  vendored headless-shell build (1194) is older than the one this repo's pinned `@playwright/test`
  1.61.0 expects (1228), a pre-existing environment gap unrelated to this change — so verified by
  inspection instead: the extracted component's markup, CSS classes, and text are copied verbatim from
  the route (same `<h2>`, same `variant-grid`/`variant-item`/`variant-label` classes, same
  `CharCard`/`Link` usage), and the two extracted functions are direct lifts of the previous inline
  IIFEs with unit tests asserting their exact prior behaviour. Left `src/routes/+page.svelte` (121
  lines) alone: it's the last routes-side violation, but nearly all of its length is the picker-tile
  CSS (`.picker-grid`/`.picker-tile` and its hover/dark/reduced-motion variants, ~70 of 121 lines) —
  there's no branch rule or divergent responsibility to split out, just a static `pickers` array and a
  `{#each}`. Splitting the CSS into a component would be the "layer whose only job is to forward
  props" the guardrail warns against, since there's exactly one caller. Leaving it as the one
  remaining violation of that criterion for now; if it keeps coming up across runs, consider changing
  the criterion to exclude `<style>` line count, since it's measuring CSS weight, not logic placement.

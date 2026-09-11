---
id: 003
title: Logic drifting out of $lib and into components
status: open
size: M
last-run: 2026-09-11
runs: 3
---

# Logic drifting out of `$lib` and into components

## Why this matters

`AGENTS.md` asks for thin route files with logic in `$lib`, and for flat component hierarchies. The
line has bent: `src/routes/char/+page.svelte` is 108 lines, and `CardChrome.svelte` is 439 — big
enough that the rules it encodes are only discoverable by reading it. Logic living in a `.svelte`
file is logic the node test project cannot reach, so it drags bounty 001 down with it: the only way
to test it is a browser test that renders the whole component.

## Scope

**In:** extracting pure logic out of `.svelte` files into `$lib` modules, splitting a component whose
responsibilities have visibly diverged, and deleting indirection that no longer earns its place.

**Out:** visual or behavioural change of any kind. A slice under this bounty should be provable by
its tests passing unchanged before and after.

## Exit criteria

- [ ] No file under `src/routes/` exceeds 100 lines. Violated by `src/routes/+page.svelte` (121,
      almost entirely CSS — see findings log), `src/routes/char/+page.svelte` (108), and
      `src/routes/boss/+page.svelte` (120, ~35 of which are CSS). The latter two regressed above 100
      lines since the 2026-09-03 run through unrelated feature work elsewhere in the repo — this
      criterion needs re-checking every run, not just trusted from the last pass's count.
- [ ] No component under `src/lib/components/` exceeds 250 lines. Violated by `BossCard.svelte`
      (252), `PresetManager.svelte` (286), `InteractiveFlow.svelte` (329), and `CardChrome.svelte`
      (439). `CharCard.svelte` (was 284) cleared this run — see findings log.
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

- 2026-09-09 (no-change, issue #80 run): unrelated to this bounty's scope, but a workaround for the
  headless-shell mismatch noted above. `pnpm test:e2e` (real Playwright `test`, not vitest's browser
  mode) runs fine against the _full_ Chromium build the environment does have
  (`/opt/pw-browsers/chromium`, revision 1194) — only `pnpm test:unit:browser` is blocked, because
  `@vitest/browser-playwright` insists on `chromium_headless_shell` specifically, and this box only
  has headless-shell 1194 against a pinned `@playwright/test` 1.61.0 that wants 1228. Point
  `playwright.config.ts`'s `use.launchOptions.executablePath` at `/opt/pw-browsers/chromium` locally
  (don't commit it — CI installs its own matching browsers) to get a real `pnpm test:e2e` run when
  this gap blocks the browser-mode unit tests.

- 2026-09-11: `CharCard.svelte` (284 lines) carried ~90 lines computing its colour scheme
  (`ELEMENT_PALETTES`, `DEFAULT_PALETTE`, `RARITY_5_PALETTE`, combined via `$derived`) — a pure
  function of `char.element`/`char.rarity`, and a branch rule deciding _what_ colours are shown, not
  DOM glue. Moved it to `$lib/card-palette.ts` as `charCardPalette()`, with unit tests in
  `card-palette.test.ts` covering per-element distinctness, the rarity-5 frame override, and the
  fallback for an unrecognised element (`none`, before a real element is assigned). This isn't a
  single-caller extraction the guardrail would flag as hollow: it's a pure function moved out of a
  component, not a new component layer, and the same palette shape is likely reusable if boss cards
  ever grow per-category colour (they don't yet — `BossCard.svelte`'s palette is a static constant,
  left alone). `CardPalette` itself was only an `export interface` inside `CardChrome.svelte`, which
  meant any plain `.ts` module (including this one and its test) importing it hit
  `@typescript-eslint/no-unsafe-*` errors — this project's eslint config only wires up the Svelte-aware
  TS program for `**/*.svelte`/`**/*.svelte.ts` files (see `eslint.config.js`), so a type sourced from a
  `.svelte` file is unresolvable type information to a plain-`.ts` linting pass. Moved the interface
  into `card-palette.ts` itself and had `CardChrome.svelte`/`BossCard.svelte` import it from there
  instead — this is itself a small instance of this bounty's own class (a type that belongs in `$lib`
  was living in a component) and worth remembering for the next slice: a type any `$lib` module needs
  to reference must not be declared inside a `.svelte` file. `CharCard.svelte` is now 201 lines (clears
  the 250-line criterion); `card-palette.ts` is 101. `pnpm lint`, `pnpm check`, and `pnpm test:unit
--run` all pass (225 unit tests, up from 222). No visual or behavioural change: the palette values
  were copied verbatim and the combination logic (`{...DEFAULT, ...ELEMENT_PALETTES[element],
...(rarity === 5 ? RARITY_5 : {})}`) is unchanged, just relocated — `CardChrome.svelte` still
  receives the identical resulting object shape.
  - While surveying, found the first exit criterion's violation list was stale: `char/+page.svelte`
    (108) and `boss/+page.svelte` (120) have both drifted over the 100-line limit since the last run
    recorded 95/(not listed) for routes other than `+page.svelte`, through unrelated feature commits
    (e.g. the `warmResultRoute`/`preloadCode` additions). Corrected the exit criterion text above.
    Neither is this slice: `boss/+page.svelte`'s excess is ~35 lines of `<style>` for the toggle rows,
    same "CSS weight, not logic placement" shape as `+page.svelte` already logged as a guardrail case;
    `char/+page.svelte`'s `warmResultRoute`/`handleSubmit` are DOM/navigation glue, not branch rules,
    so extracting them would be exactly the hollow, single-caller move the guardrail warns against.
  - Did not attempt `BossCard.svelte`, `PresetManager.svelte`, `InteractiveFlow.svelte`, or
    `CardChrome.svelte` this run — each needs its own reading for a genuine split, per the previous
    run's note, and one slice per run.

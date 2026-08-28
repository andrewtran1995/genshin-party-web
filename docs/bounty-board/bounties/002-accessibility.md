---
id: 002
title: Accessibility gaps in interactive components
status: open
size: S
last-run: 2026-08-26
runs: 3
---

# Accessibility gaps in interactive components

## Why this matters

18 files carry an `aria-*` attribute or a `role`, which means accessibility here is ad hoc rather
than systematic — applied where someone thought of it. The app is keyboard- and screen-reader-
hostile in exactly the places that matter most: `InteractiveFlow.svelte` moves focus between steps,
and `NavDrawer.svelte` is a dismissible overlay. Most of this went unchecked in CI until the first
run below wired browser-mode component tests (`pnpm test:unit:browser`) into the workflow — that
step runs every `*.svelte.test.ts` browser-mode component test, which is still a small slice of the
components in `src/lib/components/`, so this is a gap that stays open until more of the exit
criteria below have tests. Keyboard operability — the one remaining exit criterion — is the widest:
it covers every interactive element across `src/lib/components/` and `src/routes/`, not a single
component, so closing it will take more than one slice.

## Scope

**In:** markup and ARIA in `src/lib/components/` and `src/routes/`, focus management, keyboard
operability, live-region announcements for content that changes without navigation, and
`prefers-reduced-motion` handling for the tilt and card-variant effects.

**Out:** colour-contrast changes to the Skeleton theme in `src/lib/themes/genshin.css` — a visual
decision that needs a human's eye, not an unattended run's.

## Exit criteria

- [ ] Every interactive element is reachable and operable by keyboard alone, verified by an e2e or
      browser-mode test that drives it with keys rather than clicks.
- [x] Every overlay (`NavDrawer` and any successor) traps focus while open, restores it on close, and
      closes on `Escape`.
- [x] Rolling a new result announces it to assistive technology. `InteractiveFlow.svelte` has an
      `aria-live="polite"` region for the candidate reveal (still untested — the in-flow reveal is a
      separate gap from the reroll one this run closed, see findings log). The reroll flows on
      `/char`, `/boss`, `/order`, and the `/boss/[a]/[b]/[c]` gauntlet (all via `RerollControls.svelte`)
      now announce the new result through a `resultLabel` prop rendered into a visually-hidden
      `aria-live="polite"` region, tested in `RerollControls.svelte.test.ts`.
- [x] `src/lib/tilt.ts` and the card-variant effects are inert when reduced motion is preferred,
      with a test asserting it. `CardChrome.svelte.test.ts` (browser-mode) emulates
      `prefers-reduced-motion` for real via a custom `setReducedMotion` Vitest browser command
      (`vitest.browser.config.ts`, backed by Playwright's `page.emulateMedia`) and asserts, in an
      actual browser: a pointer-driven tilt never rotates the card under reduced motion but does
      otherwise, and the wish-splash entrance swaps for the CSS fade. One test exercises both
      `tilt.ts`'s JS-side bail and `CardChrome.svelte`'s `@media (prefers-reduced-motion: reduce)`
      block at once, since both gate the same visible behaviour.

## Guardrails

Do not add an accessibility-testing dependency (`axe-core` or similar) under this bounty — that is a
dependency decision for a human. Assert accessible behaviour with the roles and names already
queryable through the existing `vitest-browser-svelte` and Playwright locators.

## Findings log

- 2026-08-25: Checked off the overlay-focus criterion. `NavDrawer.svelte` is a Skeleton `Dialog`
  built on `@zag-js/dialog`, which already defaults to `trapFocus`, `closeOnEscape`, and
  `restoreFocus` when modal (the default) — so the behaviour was already correct, just unverified.
  Added `NavDrawer.svelte.test.ts` (browser-mode) asserting the trap, the `Escape` close, and the
  focus restore to the trigger.
  - Also found `pnpm test:unit:browser` — the project that runs every `*.svelte.test.ts` browser-mode
    component test, this new one included — was never invoked in CI (`.github/workflows/ci.yml` ran
    `test:unit` and `test:e2e:ci` but not `test:unit:browser`, despite already installing Chromium for
    e2e). Added the missing step so these tests actually gate merges.
  - Sharpened the remaining three exit criteria with what this run learned about them (see above):
    the reroll-announcement gap is specifically the `/char`, `/boss`, `/order` navigation-based reroll
    (not `InteractiveFlow`, which already has an untested `aria-live` region), and the reduced-motion
    criterion is already implemented in both `tilt.ts` and `CardChrome.svelte` — it just has no test,
    and the CSS half may need a browser-provider capability (reduced-motion emulation) this project
    doesn't currently reach for in a per-test way.
- 2026-08-25: Checked off the reroll-announcement criterion. Added a `resultLabel` prop to
  `RerollControls.svelte` that renders into a visually-hidden `aria-live="polite"` region (the same
  pattern `InteractiveFlow.svelte` already uses for its candidate reveal), wired it from all four call
  sites (`/char`, `/boss`, `/order`, and the `/boss/[a]/[b]/[c]` gauntlet — the last one wasn't named
  in the original criterion text but uses the same component and needed the same fix to keep
  `resultLabel` non-optional), and added browser-mode assertions to `RerollControls.svelte.test.ts`
  covering both the initial label and the update on reroll.
  - Considered relying on SvelteKit's built-in post-navigation title announcement instead of adding an
    explicit live region, since `goto()` already changes `<svelte:head><title>`. Went with an explicit
    region because it is directly testable in a component test without a full e2e navigation, and
    because it can carry a more descriptive label (e.g. the full gauntlet boss list) than a page title
    would.
  - `InteractiveFlow.svelte`'s own `aria-live` region (candidate reveal, party-complete) is still
    untested — left open, since it's a distinct component from `RerollControls` and covering it is its
    own slice.
  - No-change note: did not touch the keyboard-operability or reduced-motion criteria this run; both
    are unchanged from the prior findings above.
- 2026-08-26: Checked off the reduced-motion criterion — the last one blocked on tooling. The prior
  run's "worth checking again" note was right: `@vitest/browser-playwright`'s provider passes
  `{ page, context, frame, iframe }` into custom browser commands via `getCommandsContext`
  (confirmed by reading `node_modules/@vitest/browser-playwright/dist/index.js`, since the public
  `.d.ts` only types the generic `BrowserCommandContext` and doesn't advertise this). Added a
  `setReducedMotion` command in `vitest.browser.config.ts` that calls the real
  `page.emulateMedia({ reducedMotion })`, typed via a `declare module 'vitest/browser'` augmentation
  in `src/vitest-browser.d.ts`. `CardChrome.svelte.test.ts` uses it to drive a real pointermove at
  `tilt.ts` and read real computed styles off `CardChrome`'s `@media (prefers-reduced-motion: reduce)`
  block, under both motion states.
  - Skipped the originally-suggested split (a jsdom-stubbed unit test for `tilt.ts`, separate from the
    CSS browser test) — this project has no jsdom/happy-dom dependency at all, so a `window`-touching
    plain-function test isn't reachable outside browser mode anyway. Testing both through one real
    pointer interaction is more direct than stubbing `matchMedia` in two places for the same
    behaviour.
  - Did not touch the keyboard-operability criterion this run — see the widened note in "Why this
    matters" above on why it's a multi-slice criterion rather than a one-file fix.

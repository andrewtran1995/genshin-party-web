---
id: 002
title: Accessibility gaps in interactive components
status: open
size: S
last-run: 2026-08-25
runs: 1
---

# Accessibility gaps in interactive components

## Why this matters

18 files carry an `aria-*` attribute or a `role`, which means accessibility here is ad hoc rather
than systematic — applied where someone thought of it. The app is keyboard- and screen-reader-
hostile in exactly the places that matter most: `InteractiveFlow.svelte` moves focus between steps,
`NavDrawer.svelte` is a dismissible overlay, and rerolling a result on `/char`, `/boss`, or `/order`
(via `RerollControls.svelte`) client-side-navigates to a new result page without announcing that
anything changed. Most of this went unchecked in CI until the first run below wired browser-mode
component tests (`pnpm test:unit:browser`) into the workflow — that step only runs the one component
test that exists so far, so this is a gap that stays open until more of the exit criteria below have
tests.

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
- [ ] Rolling a new result announces it to assistive technology. `InteractiveFlow.svelte` already has
      an `aria-live="polite"` region for the candidate reveal (untested, but present); the reroll
      flows on `/char`, `/boss`, and `/order` (via `RerollControls.svelte`) do not — a reroll there is
      a client-side navigation to a new result page with nothing announcing that the page changed.
- [ ] `src/lib/tilt.ts` and the card-variant effects are inert when reduced motion is preferred,
      with a test asserting it. Both already check `prefers-reduced-motion` in the actual
      implementation — `tilt.ts`'s pointer/motion handlers bail on `reduce.matches`, and
      `CardChrome.svelte` has a `@media (prefers-reduced-motion: reduce)` block neutralising the
      tilt transform and the reveal/shimmer animations — so this is untested, not unimplemented.
      `tilt.ts`'s behaviour is a plain-function/DOM-action test (stub `window.matchMedia`); the CSS
      side needs a real browser test with reduced motion emulated, which `vitest-browser-playwright`
      does not currently expose a per-test way to set (worth checking again — an option here would
      unblock this criterion).

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

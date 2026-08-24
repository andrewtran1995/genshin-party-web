---
id: 002
title: Accessibility gaps in interactive components
status: open
size: S
last-run: never
runs: 0
---

# Accessibility gaps in interactive components

## Why this matters

18 files carry an `aria-*` attribute or a `role`, which means accessibility here is ad hoc rather
than systematic — applied where someone thought of it. The app is keyboard- and screen-reader-
hostile in exactly the places that matter most: `InteractiveFlow.svelte` moves focus between steps,
`NavDrawer.svelte` is a dismissible overlay, and `RerollControls.svelte` mutates results in place
without announcing that anything changed. Nothing in CI checks any of this.

## Scope

**In:** markup and ARIA in `src/lib/components/` and `src/routes/`, focus management, keyboard
operability, live-region announcements for content that changes without navigation, and
`prefers-reduced-motion` handling for the tilt and card-variant effects.

**Out:** colour-contrast changes to the Skeleton theme in `src/lib/themes/genshin.css` — a visual
decision that needs a human's eye, not an unattended run's.

## Exit criteria

- [ ] Every interactive element is reachable and operable by keyboard alone, verified by an e2e or
      browser-mode test that drives it with keys rather than clicks.
- [ ] Every overlay (`NavDrawer` and any successor) traps focus while open, restores it on close, and
      closes on `Escape`.
- [ ] Rolling a new result announces it to assistive technology.
- [ ] `src/lib/tilt.ts` and the card-variant effects are inert when reduced motion is preferred,
      with a test asserting it.

## Guardrails

Do not add an accessibility-testing dependency (`axe-core` or similar) under this bounty — that is a
dependency decision for a human. Assert accessible behaviour with the roles and names already
queryable through the existing `vitest-browser-svelte` and Playwright locators.

## Findings log

- _(no runs yet)_

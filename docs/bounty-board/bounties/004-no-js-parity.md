---
id: 004
title: No-JS fallback parity with the client-side flows
status: open
size: S
last-run: 2026-08-27
runs: 1
---

# No-JS fallback parity with the client-side flows

## Why this matters

`/char`, `/boss`, and `/order` each ship a `+page.server.ts` form action so the pickers work without
JavaScript, and `e2e/no-js.spec.ts` covers some of it. But the client path and the server path are
two implementations of one behaviour, kept in step by hand — nothing fails when they diverge.
`/interactive` has no server fallback at all, which may be a deliberate choice or may be an
oversight; the repo does not say which.

## Scope

**In:** the three `+page.server.ts` actions, their shared helpers in `src/lib/genshin/`, and
`e2e/no-js.spec.ts`. Documenting a deliberate gap counts as satisfying a criterion — a written
decision beats a silent one.

**Out:** adding a server fallback to `/interactive`. That is a product decision about a
multi-step stateful flow, and it needs a human's call before any code is written.

## Exit criteria

- [x] Each of `/char`, `/boss`, and `/order` produces the same result set from the server action as
      from the client roll, given the same inputs — asserted by a test over the shared helper, not by
      comparing two hand-written lists. Already true architecturally (both the client `handleSubmit`
      and the server actions call the same `parseCharFilters`/`rollCharUrl`,
      `parseBossFilters`/`rollBossUrl`, and `rollOrderUrl` from `src/lib/genshin/rolls.ts`), and
      `rolls.test.ts` already exercises those functions directly with property-based tests — nothing
      new needed this run, just confirmed.
- [ ] Validation failures in every server action return `fail()` with a message the no-JS page
      actually renders, covered by `e2e/no-js.spec.ts`. **Narrowed** after this run: only `/char`'s
      two actions (`roll`, `debug`) have a `fail()` path reachable through the real form with the
      current dataset, and both are now covered. `/boss`'s `fail()` (gauntlet + weekly with too few
      weekly bosses) is not reachable — there are 13 weekly bosses against a gauntlet size of 3 — so
      it stays unverified by e2e until either the roster shrinks or a test drives the action directly
      instead of through the UI. `/order`'s action has no `fail()` call at all; it always succeeds. A
      future run should either add a direct (non-UI) test for `/boss`'s fail path, or drop it from
      this criterion if it's judged untestable through the real form on principle.
- [x] `/interactive`'s lack of a fallback is either covered by an ADR under `docs/adr/` or raised as
      a question for a human in the findings log. Raised below — no ADR exists yet.

## Guardrails

Do not make the client path call the server action to remove the duplication. Client-side rolling is
the architecture of record — see `docs/adr/0001-client-side-randomization-and-url-state.md`.
Convergence here means sharing a pure helper, never sharing a round trip.

## Findings log

- 2026-08-27: Added the missing `fail()` coverage for `/char` to `e2e/no-js.spec.ts`: rolling with
  `element=none&rarity=4` (the Traveler element has no 4-star entry — a real, always-empty filter
  combo, not a synthetic one) exercises the `roll` action's `CHAR_ERROR` path, and submitting the
  debug form with no character selected exercises the `debug` action's `debugError` path. Both assert
  the rendered `role="alert"` text.
  - Getting there required a small fixtures.ts change: the `consoleErrors` auto-fixture fails any test
    where the page logs a console error, and Chrome logs a "Failed to load resource" console error for
    a form action's own non-2xx `fail()` response — expected here, not a bug. Added an
    `expectedConsoleErrors: RegExp[]` option fixture (default `[]`, opt in via `test.use(...)`) so a
    test can allowlist the specific expected message instead of the fixture losing its bite globally.
  - `/boss` and `/order` are not covered by this criterion — see the narrowed exit criterion above for
    why (no reachable `fail()` path through the real form for either, with the current dataset).
  - Question for a human, re: criterion 3 — is `/interactive` missing a server fallback a deliberate
    choice (it's a multi-step stateful flow; a form-action fallback would need to either resolve in one
    POST or reintroduce server-side session state) or just not built yet? If deliberate, it should
    become an ADR; if not, it's a real product decision (out of this bounty's scope either way, per its
    own guardrail).
  - While chasing why the pre-existing `/boss` no-JS test was flaky in the background, root-caused it
    to a comma-in-boss-name routing bug unrelated to this bounty — filed as bounty 007
    (`007-punctuated-name-routing.md`) rather than fixed here, since it's out of scope for no-JS parity
    and deserved its own exit criteria.

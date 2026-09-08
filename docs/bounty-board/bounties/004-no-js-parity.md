---
id: 004
title: No-JS fallback parity with the client-side flows
status: done
size: S
last-run: 2026-09-08
runs: 3
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
      and the server actions call the same `parseCharFilters`/`rollCharUrl` (`characters.ts`),
      `parseBossFilters`/`rollBossUrl` (`bosses.ts`), and `rollOrderUrl` (`order.ts`) — all under
      `src/lib/genshin/`), and each module's own `.test.ts` already exercises those functions directly
      with property-based tests — nothing new needed this run, just confirmed. (These lived in one
      `rolls.ts` when this criterion was checked; bounty 005 later split it per-dataset — see bounty
      006's findings.)
- [x] Validation failures in every server action return `fail()` with a message the no-JS page
      actually renders, covered by a test. `/char`'s two actions (`roll`, `debug`) have a `fail()`
      path reachable through the real form with the current dataset, and both are covered by
      `e2e/no-js.spec.ts`. `/boss`'s `fail()` (gauntlet + weekly with too few weekly bosses) is not
      reachable through the real form — there are 13 weekly bosses against a gauntlet size of 3, so
      every filter combination a user can submit resolves to a real boss — so it is instead covered
      directly: `src/routes/boss/boss-action.test.ts` calls `actions.default` with a mocked
      `rollBossUrl` that returns `undefined`, bypassing the browser and the UI entirely. `/order`'s
      action has no `fail()` call at all; it always succeeds, so there is nothing to cover.
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
- 2026-09-02: Worked via issue #75 (filed from the SvelteKit 2.66 feature sweep, issue #88), which
  proposed collapsing the duplicated no-JS/client roll pair with a `form()` remote function whose
  `.enhance()` runs the existing client-side roll, leaving `form()` itself as the no-JS-only path —
  the shape the issue itself flagged as the one that would preserve the client-side-randomizer
  architecture (`docs/adr/0001-client-side-randomization-and-url-state.md`).
  - Migrated `/order` — the smallest of the three (no `fail()` path; `rollOrderUrl()` can't fail) —
    from `+page.server.ts` + a hand-written `handleSubmit` to `src/routes/order/order.remote.ts`'s
    `rollOrder = form(...)` plus `rollOrder.enhance(...)` in `+page.svelte`. Confirmed it comes out
    cleaner: one declaration instead of two files, and the dead `clientError` state (rollOrderUrl
    never actually fails) fell out naturally. Confirmed with a full local `pnpm test:e2e` run
    (all 22 specs green, `e2e/no-js.spec.ts`'s order case included) that the no-JS path still does a
    real POST → `redirect(303, ...)`, and that with JS enabled the roll still never leaves the
    browser — `.enhance()`'s callback never calls the form's own `submit()`, so no fetch happens.
  - `/char` and `/boss` are **not migrated this run** — both have real `fail()` paths and, for
    `/char`, an extra `debug` action; `form()` supports multiple named exports so it's still
    possible, but each is a bigger slice than one issue run should take blind. Left as the obvious
    next slice for this bounty or a follow-up issue.
  - Required flipping `kit.experimental.remoteFunctions` on in `svelte.config.js` — now a house
    pattern documented in `AGENTS.md`'s SvelteKit-conventions section. It's an experimental API
    (`$app/server`'s `form`/`query`/`command`), so a future SvelteKit bump could change its shape;
    revisit if `pnpm check` or `pnpm build` starts failing after a `@sveltejs/kit` upgrade.
- 2026-09-08: Closed the last open exit criterion by taking the "direct (non-UI) test" branch this
  bounty's own findings log left open for `/boss`'s `fail()` path. Added
  `src/routes/boss/boss-action.test.ts`: it `vi.mock`s `$lib/genshin/bosses` so `rollBossUrl` returns
  `undefined`, then calls `actions.default` from `src/routes/boss/+page.server.ts` directly with a
  crafted `FormData`, asserting the exact `fail(404, { error: BOSS_ERROR })` the route would return.
  This is genuinely untestable through the real form on the current dataset — 13 weekly bosses against
  a `GAUNTLET_SIZE` of 3 means every filter combination a user can submit resolves to a real boss, and
  the action never forwards an `exclude` list (the only thing that can empty the pool) — so mocking the
  helper was the only way to exercise the branch at all, direct or otherwise.
  - Named the test file `boss-action.test.ts` rather than `+page.server.test.ts`: Vitest's SvelteKit
    plugin warns "Files prefixed with + are reserved" and the warning is worth avoiding even though the
    run passed anyway. Worth a house rule if a future run hits the same thing testing `/char`'s actions.
  - All three exit criteria are now met — flipping `status` to `done`. `/char`/`/boss` still use
    `+page.server.ts` actions rather than `form()` remote functions (only `/order` was migrated, per
    the 2026-09-02 entry above); that migration remains available as a separate slice but is no longer
    something this bounty's exit criteria require, since parity itself is now fully covered either way.

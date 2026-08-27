---
id: 004
title: No-JS fallback parity with the client-side flows
status: in-progress
size: S
last-run: never
runs: 0
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

- [ ] Each of `/char`, `/boss`, and `/order` produces the same result set from the server action as
      from the client roll, given the same inputs — asserted by a test over the shared helper, not by
      comparing two hand-written lists.
- [ ] Validation failures in every server action return `fail()` with a message the no-JS page
      actually renders, covered by `e2e/no-js.spec.ts`.
- [ ] `/interactive`'s lack of a fallback is either covered by an ADR under `docs/adr/` or raised as
      a question for a human in the findings log.

## Guardrails

Do not make the client path call the server action to remove the duplication. Client-side rolling is
the architecture of record — see `docs/adr/0001-client-side-randomization-and-url-state.md`.
Convergence here means sharing a pure helper, never sharing a round trip.

## Findings log

- _(no runs yet)_

---
id: 001
title: Untested components and uncovered branches
status: open
size: S
last-run: never
runs: 0
---

# Untested components and uncovered branches

## Why this matters

Six of the fourteen components under `src/lib/components/` have a `.svelte.test.ts` beside them;
the rest have none. The untested ones include the two largest surfaces in the app —
`CardChrome.svelte` (450 lines) and `PlayerNameInputs.svelte` (137) — so a regression in card
chrome or player-name entry reaches production with only the five e2e specs standing between it and
a user. Unit tests are also the cheap layer: `pnpm test:unit --run` gates every commit, e2e does not.

## Scope

**In:** new `*.svelte.test.ts` (browser project) and `*.test.ts` (node project) files, plus new
cases added to existing test files. Small production edits that exist purely to make behaviour
observable — exporting a pure helper, naming a computed value.

**Out:** e2e specs under `e2e/` (they belong to the flows they cover), and refactors motivated by
testability rather than by the code itself. If a component can only be tested by restructuring it,
that is bounty 003's work, not this one's.

## Exit criteria

- [ ] Every component in `src/lib/components/` has a test file beside it.
- [ ] Every module in `src/lib/` that exports a function has a test file beside it.
- [ ] `pnpm test:coverage` reports no uncovered branch in `src/lib/genshin/` — the rolling logic,
      where a silent wrong answer is invisible to the user.

## Guardrails

Behavioural tests only, per `AGENTS.md`: assert what a user or caller observes, never that an
internal function was called. A test that would pass against a re-implementation is the goal; a test
that mirrors the implementation is worse than no test, because it has to be rewritten every time the
code moves.

## Findings log

- _(no runs yet)_

---
id: 007
title: Prerendered routes 404 for dataset names with a comma
status: in-progress
size: S
last-run: never
runs: 0
---

# Prerendered routes 404 for dataset names with a comma

## Why this matters

`rollBossUrl` builds boss result URLs with `encodeURIComponent(boss.name)`, which turns a comma into
`%2C`. `boss/[name]/+page.server.ts` prerenders one static file per boss via `entries()`, and the
prerenderer writes those files using the literal name (spaces and commas included), not the encoded
form. At least two current weekly bosses — "Lupus Boreas, Dominator of Wolves" and "Shouki no Kami,
the Prodigal" — have a comma in their name, and a request for `/boss/Lupus%20Boreas%2C...` 404s
against `vite preview` even though `/boss/Aeonblight%20Drake` (space only, no comma) resolves fine.
Confirmed by curling a local `vite preview` build directly; `%20` alone is not the trigger, `%2C` is.
This is also why `e2e/no-js.spec.ts`'s boss-roll test is a ~3.4% flake (2 of 58 bosses trip it) —
found while working bounty 004, not caused by it.

Not yet confirmed whether this also breaks on the real Vercel deployment (its static file serving may
percent-decode differently than `vite preview` does) — that's the first thing the next run on this
bounty should check, since it changes how urgent the fix is.

## Scope

**In:** `src/lib/genshin/rolls.ts` (URL building), the `boss/[name]` and `char/[name]` route's
`entries()`/prerendering, and any dataset name that contains a character `encodeURIComponent` escapes
(comma today; apostrophes and colons are worth checking too — `getAllBossNames()` /
`getAllCharNames()` against a quick scan for non-alphanumeric characters would find the full set).

**Out:** changing what characters are valid in `genshin-db` names, and touching the Vercel adapter
config.

## Exit criteria

- [ ] Confirmed whether the mismatch reproduces on a real Vercel deploy, not just `vite preview` —
      written down here either way.
- [ ] Every boss and character name round-trips: `rollBossUrl`/`rollCharUrl`'s encoded path resolves
      (200, not 404) against a built preview server, for every name in the dataset — asserted by a
      test that iterates `getAllBossNames()`/`getAllCharNames()`, not by hand-picking the two known
      offenders.
- [ ] `e2e/no-js.spec.ts`'s boss-roll test no longer depends on which boss got randomly picked.

## Guardrails

Fix the mismatch, don't paper over it — do not exclude comma-bearing names from the random pool as a
workaround; a player should be able to roll any boss in the game.

## Findings log

- 2026-08-27: Filed while working bounty 004 (no-js parity), which needed a reliable no-JS e2e run
  and kept hitting this as an unrelated flake. Root-caused to the comma specifically (not whitespace
  or encoding in general) by curling a local `vite preview` build for both an affected and an
  unaffected boss name. Not yet fixed — out of scope for 004, and this bounty's own first exit
  criterion (real-deploy reproduction) needs answering before the fix's urgency is clear.

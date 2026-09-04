---
id: 007
title: Prerendered routes 404 for dataset names with reserved punctuation
status: open
size: S
last-run: 2026-09-04
runs: 2
---

# Prerendered routes 404 for dataset names with reserved punctuation

## Why this matters

`rollBossUrl`/`rollCharUrl` built result URLs with plain `encodeURIComponent(name)`. `boss/[name]` and
`char/[name]` prerender one static file per name via `entries()`, and the prerenderer writes those
files using the literal name (spaces, commas, colons and all), not the encoded form. At least two
current weekly bosses — "Lupus Boreas, Dominator of Wolves" and "Shouki no Kami, the Prodigal" — have
a comma in their name, and a request for `/boss/Lupus%20Boreas%2C...` 404s against `vite preview` even
though `/boss/Aeonblight%20Drake` (space only, no comma) resolves fine. This is also why
`e2e/no-js.spec.ts`'s boss-roll test was a ~3.4% flake (2 of 58 bosses tripped it) — found while
working bounty 004, not caused by it.

**Root cause, found this run:** it's not `vite preview`'s file lookup being loose about encoding — it's
the opposite. `@sveltejs/kit/src/exports/vite/preview/index.js` resolves a request path to a
prerendered file with `decodeURI(filename)`, and `decodeURI` (unlike `decodeURIComponent`) deliberately
refuses to decode escapes for URI-reserved characters: `; / ? : @ & = + $ , #`. `encodeURIComponent`
escapes all of those, so any name containing one round-trips through `encode → decodeURI` as a literal
`%XX` sequence instead of the original character, and no longer matches the literal filename on disk.
Space (`%20`) and apostrophe (never escaped by `encodeURIComponent`) survive; comma (`%2C`) and colon
(`%3A`) don't — confirmed by building and curling both an affected and unaffected boss/char name,
scripted below.

## Scope

**In:** `src/lib/genshin/rolls.ts` (URL building) and its two `encodeURIComponent(name)` call sites in
`char/+page.svelte`/`char/+page.server.ts` (the "show all variants" debug form), for any dataset name
containing a character in `decodeURI`'s reserved-and-undecoded set (`, ; : @ & = + $` — `/ ? #` are
excluded since those must stay escaped to not restructure the path). A scan of `getAllBossNames()` /
`getAllCharNames()` for non-alphanumeric characters found the full current set: comma and colon (both
broken); apostrophe and hyphen (both already fine, since `encodeURIComponent` never escapes them).

**Out:** changing what characters are valid in `genshin-db` names, and touching the Vercel adapter
config.

## Exit criteria

- [x] Every boss and character name round-trips: `rollBossUrl`/`rollCharUrl`'s encoded path resolves
      (200, not 404) against a built preview server, for every name in the dataset — asserted by a
      test that iterates `getAllBossNames()`/`getAllCharNames()`, not by hand-picking the two known
      offenders. See `e2e/prerendered-routes.spec.ts` (added this run) plus the unit-level
      `encodePathSegment` coverage in `src/lib/genshin/rolls.test.ts`.
- [x] `e2e/no-js.spec.ts`'s boss-roll test no longer depends on which boss got randomly picked — the
      fix removes the possibility structurally, and the test now also asserts the "Random boss" heading
      renders (it previously only checked the URL shape, which would have passed even on a 404 page).
- [ ] Confirmed whether the mismatch reproduces on a real Vercel deploy, not just `vite preview` — still
      **not confirmed**. This sandboxed run has no Vercel deploy credentials or network access to test
      against a live deployment. Worth noting: `adapter-vercel`'s generated `.vercel/output/config.json`
      routes prerendered pages via literal (non-percent-encoded) `src` regexes matched against the
      decoded pathname, which is a completely different code path from SvelteKit's own preview server —
      so the `vite preview` decodeURI bug found this run may simply not apply there. That's a hypothesis,
      not a finding; the fix shipped this run doesn't depend on it either way (it makes routing correct
      for `vite preview` and CI's e2e suite regardless of what Vercel does), but an agent with deploy
      access should still check it and update this line.

## Guardrails

Fix the mismatch, don't paper over it — do not exclude comma-bearing names from the random pool as a
workaround; a player should be able to roll any boss in the game.

## Findings log

- 2026-08-27: Filed while working bounty 004 (no-js parity), which needed a reliable no-JS e2e run
  and kept hitting this as an unrelated flake. Root-caused to the comma specifically (not whitespace
  or encoding in general) by curling a local `vite preview` build for both an affected and an
  unaffected boss name. Not yet fixed — out of scope for 004, and this bounty's own first exit
  criterion (real-deploy reproduction) needs answering before the fix's urgency is clear.
- 2026-08-28: Root-caused precisely (see "Why this matters") to `@sveltejs/kit`'s preview server using
  `decodeURI` instead of `decodeURIComponent` when resolving a prerendered file path. Fixed by adding
  `encodePathSegment` to `src/lib/genshin/rolls.ts` — the same as `encodeURIComponent` except it leaves
  `decodeURI`-safe reserved characters (`, ; : @ & = + $`) un-escaped, since they're valid literal
  characters within a single URI path segment (RFC 3986 `pchar`) and don't need escaping at all. Applied
  it to all four `encodeURIComponent(name)` call sites that build a `/boss/` or `/char/` path
  (`rolls.ts` ×3, plus the char debug form in both `+page.svelte` and `+page.server.ts`). Added
  `e2e/prerendered-routes.spec.ts` (iterates every boss/char name against the built preview server) and
  unit coverage for `encodePathSegment` in `rolls.test.ts`. Confirmed the fix locally: before it, `curl`
  against a built `vite preview` 404'd for both comma bosses and both colon-bearing bosses tested; after
  it, all pass. Exit criterion 1 (real Vercel deploy) remains unconfirmed — no deploy access in this
  sandboxed run; left a hypothesis in the exit-criteria note above for whoever can check it. Did not
  rename the file (`007-punctuated-name-routing.md`) since the id is stable, but broadened the title
  since "comma" undersold what was actually broken (colon too).
- 2026-09-04: Issue #87 (filed from the SvelteKit feature sweep) considered `src/hooks.ts`'s universal
  `reroute` hook as a possible fix path for this bounty and ruled it out: on Vercel, a hard request for
  a prerendered path is served as a static file from the CDN before any function runs, so `reroute`
  never executes for exactly the requests that 404 today — it would only paper over client-side
  navigations. This bounty's exit-criteria-1 question (real Vercel deploy behaviour) is unaffected;
  the fix already shipped here (`encodePathSegment`) still stands as the only real one. The run that
  worked #87 shipped `handleError` in `src/hooks.server.ts`/`src/hooks.client.ts` instead, which is
  useful but orthogonal to this bounty's routing fix.

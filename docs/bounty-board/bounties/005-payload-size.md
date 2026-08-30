---
id: 005
title: Shipped payload and generated data size
status: in-progress
size: M
last-run: 2026-08-29
runs: 1
---

# Shipped payload and generated data size

## Why this matters

The whole architecture trades bundle weight for a serverless-free runtime: `scripts/gen-data.ts`
trims `genshin-db` into JSON that ships to the browser, and every roll happens client-side. That
trade only pays while the payload stays small, and nothing measures it. A field added to the
extraction script — or an icon set that grows with the next game version — inflates every page load
silently, on the mobile connections this app is mostly opened from.

## Scope

**In:** `scripts/gen-data.ts` and the shape of the JSON under `src/lib/genshin/data/`, how that data
is loaded and code-split by `src/lib/genshin/index.ts`, asset handling under `static/icons/`, and any
measurement or budget added to guard the result.

**Out:** upgrading, replacing, or removing the `genshin-db` dependency, and changing the Vercel
adapter. Both are `AGENTS.md` commitments a run does not get to revisit.

## Exit criteria

- [ ] The size of each generated file under `src/lib/genshin/data/` is recorded somewhere a diff can
      show it moving.
- [x] No field is extracted into the shipped JSON that no runtime code reads — verified against
      actual usage, not assumed. Swept once (`Char.fandomUrl`, see findings log); re-check on the
      next pass since `genshin-db` fields aren't audited automatically.
- [ ] Data a route does not need is not in that route's initial load. `src/lib/genshin/core.ts`
      statically imports both `characters.json` and `bosses.json` at module scope, and
      `src/lib/genshin/index.ts` re-exports everything from `core.ts` in one barrel — so `/char`,
      which only calls `getChars`, still bundles all of `bosses.json`, and vice versa for `/boss`.
      Splitting `core.ts` into char- and boss-specific modules (dropping the barrel or making it
      export type-only) would let each route's chunk carry only the dataset it reads. Not attempted
      this run — it touches every route's imports, bigger than one slice.

## Guardrails

The generated data files are gitignored build artifacts. Never commit them, and never make a change
whose only effect is visible after a manual `pnpm gen:data` that CI does not run — `build` and
`prepare` regenerate this data, so any measurement must survive regeneration from scratch.

## Findings log

- 2026-08-29: Audited every field on `Char` and `Enemy` against actual reads across
  `src/routes/`, `src/lib/components/`, and `src/lib/genshin/`. Every field is read except
  `Char.fandomUrl` (extracted in `scripts/lib/trim.ts` from `genshin-db`'s `url.fandom`, typed on
  `Char`, never rendered or linked anywhere — only set in test fixtures). Removed it from
  `RawChar`/`Char`/`trimCharacters` and the four test fixtures that stubbed it, and updated the
  `docs/architecture.md` line that named it. Confirmed by running `pnpm gen:data` from scratch: the
  regenerated `characters.json` has zero `fandomUrl` occurrences. One field off every one of the 118
  characters in the shipped JSON. Second exit criterion (route-scoped data loading) is a real gap
  too — see that criterion's note — but is a bigger slice than this run took.

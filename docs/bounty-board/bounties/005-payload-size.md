---
id: 005
title: Shipped payload and generated data size
status: done
size: M
last-run: 2026-09-01
runs: 3
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
is loaded and code-split by `src/lib/genshin/*.ts` (there is no barrel anymore — see findings log),
asset handling under `static/icons/`, and any measurement or budget added to guard the result.

**Out:** upgrading, replacing, or removing the `genshin-db` dependency, and changing the Vercel
adapter. Both are `AGENTS.md` commitments a run does not get to revisit.

## Exit criteria

- [x] The size of each generated file under `src/lib/genshin/data/` is recorded somewhere a diff can
      show it moving. `gen-data.ts` now writes `src/lib/genshin/data-size.json` (raw and gzip byte
      counts per file) on every run; see findings log.
- [x] No field is extracted into the shipped JSON that no runtime code reads — verified against
      actual usage, not assumed. Swept once (`Char.fandomUrl`, see findings log); re-check on the
      next pass since `genshin-db` fields aren't audited automatically.
- [x] Data a route does not need is not in that route's initial load. Split `core.ts`/`rolls.ts` into
      `characters.ts`, `bosses.ts`, `order.ts`, and `sample.ts`, removed the `index.ts` barrel, and
      pointed every route at its specific module; see findings log for the measured before/after.

## Guardrails

The generated data files (`src/lib/genshin/data/*.json`, `static/icons/**`) are gitignored build
artifacts. Never commit them, and never make a change whose only effect is visible after a manual
`pnpm gen:data` that CI does not run — `build` and `prepare` regenerate this data, so any measurement
must survive regeneration from scratch. `src/lib/genshin/data-size.json` (added 2026-08-30) is the one
deliberate exception: it is a small, hand-sized report _about_ the generated files, not the generated
data itself, and is tracked in git on purpose so its diff is the measurement. Don't extend that
exception to anything bigger than a size/shape summary.

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
- 2026-08-30: Closed the size-recording exit criterion. Added `scripts/lib/size-report.ts`
  (`measureDataFile`/`buildSizeReport`, unit-tested in `size-report.test.ts`) and wired it into
  `gen-data.ts`: after writing `characters.json`/`bosses.json`, it now also writes
  `src/lib/genshin/data-size.json` with each file's raw and gzip byte length. That report file is
  tracked in git — unlike the data files it describes — so it moves in the diff of any PR that
  regenerates the dataset with a shape change, and is deterministic run-to-run (confirmed by running
  `pnpm gen:data` twice and diffing the result: byte-for-byte identical both times). Current baseline,
  for reference: `characters.json` 43291 bytes / 4718 gzipped, `bosses.json` 45386 bytes / 15791
  gzipped.
  - Scoped to just the two JSON files named in the criterion, not `static/icons/**` — icon weight is a
    different kind of payload (binary assets, not JSON shape) and probably wants its own measurement
    (e.g. a directory byte count) rather than reusing this per-file JSON report; left as a follow-up
    rather than folded in here.
  - Considered enforcing a size budget (failing CI past some threshold) instead of just recording. Went
    with recording only — the exit criterion asks for visibility, not a gate, and a budget number
    would be a guess with no data behind it yet. A future run can add a budget once a few PRs' worth of
    `data-size.json` diffs give a real baseline to set one against.
  - Did not touch the third exit criterion (route-scoped data loading via splitting `core.ts`) this
    run — still the correctly-scoped bigger slice noted in 2026-08-29's entry; unchanged.
- 2026-09-01: Closed the third exit criterion. Splitting `core.ts` alone would not have worked:
  `rolls.ts` mixed char-, boss-, and order-URL logic in one file, and every route imported both
  through the shared `$lib/genshin` barrel — Rollup treats a barrel's transitive graph as one unit for
  chunking, so even with `core.ts` split, importing anything from the barrel pulled the whole thing
  into a shared chunk regardless of which named export a given route actually used. Split both files
  along domain lines into `src/lib/genshin/{characters,bosses,order,sample}.ts` (`sample` factored out
  since char, boss, and order code all use it) and updated all sixteen importers to import their
  specific module directly instead of `$lib/genshin`; deleted `index.ts` and `core.ts`/`rolls.ts`
  outright rather than keeping a type-only re-export, since nothing outside `$lib/genshin` needed the
  option types. Verified with a from-scratch `pnpm build`: the client used to emit one 85.9 KB chunk
  containing both `characters.json` and `bosses.json` (`grep`-confirmed both datasets present, shared
  by every route's node); after the split, `/boss`'s nodes import a 45.3 KB boss-only chunk, `/char`'s
  nodes import a 39.2 KB char-only chunk, and `/order`'s nodes import neither (checked via the client
  manifest's `imports` graph) — matching the criterion's actual wording, not just the shape of the fix
  the criterion guessed at. Same check on the server manifest: one 97 KB combined `genshin.js` chunk
  became separate `characters.js` (45.4 KB) and `bosses.js` (48.0 KB) chunks.
  - All three exit criteria are now met; moving this bounty to `done`. A future run auditing the
    codebase for other barrel-file re-export patterns (`$lib/genshin` was the only one with a real
    payload behind it, but the pattern itself could recur) would be a reasonable next class to open,
    if one is found — not opened here since this run didn't find another instance.
  - Untouched follow-up from 2026-08-30 still stands: `static/icons/**` weight has no measurement.
    That's a distinct kind of payload (binary assets vs. JSON shape) and would want its own bounty if
    someone wants to open one; not folded in here.

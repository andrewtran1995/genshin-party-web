---
id: 005
title: Shipped payload and generated data size
status: in-progress
size: M
last-run: never
runs: 0
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
- [ ] No field is extracted into the shipped JSON that no runtime code reads — verified against
      actual usage, not assumed.
- [ ] Data a route does not need is not in that route's initial load.

## Guardrails

The generated data files are gitignored build artifacts. Never commit them, and never make a change
whose only effect is visible after a manual `pnpm gen:data` that CI does not run — `build` and
`prepare` regenerate this data, so any measurement must survive regeneration from scratch.

## Findings log

- _(no runs yet)_

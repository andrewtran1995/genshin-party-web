# Architecture — CLI ↔ Web mapping

`genshin-party-web` will port the four `genshin-party` CLI commands to a SvelteKit app on Vercel. This doc records the intended mapping and the boundaries between what already exists (foundation: build, lint, test, routing skeleton) and what's still to come (domain logic).

## Foundation tooling (mirrors `wedding-site`)

| Concern           | Choice                                                                       |
| ----------------- | ---------------------------------------------------------------------------- |
| Framework         | SvelteKit 2 + Svelte 5 runes                                                 |
| Hosting           | Vercel via `@sveltejs/adapter-vercel`                                        |
| Language          | TypeScript, strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` |
| Linting           | ESLint (`typescript-eslint` type-checked) + Prettier + Stylelint             |
| Browser targeting | `.browserslistrc` → esbuild via `browserslist-to-esbuild`                    |
| Unit tests        | Vitest                                                                       |
| E2E tests         | Playwright (Chromium)                                                        |
| Pre-commit        | Husky → `pnpm lint` + `pnpm check` + `pnpm test:unit`                        |
| CI                | GitHub Actions                                                               |

## Route map

| CLI command           | Web route      | Status                                                                                                 |
| --------------------- | -------------- | ------------------------------------------------------------------------------------------------------ |
| `genshin-party char`  | `/char`        | Working — form action filters via `getChars` and renders portrait/region.                              |
| `genshin-party boss`  | `/boss`        | Working — form action picks one or three via `getBosses`, honoring gauntlet/weekly.                    |
| `genshin-party order` | `/order`       | Working — pure shuffle, no data dependency.                                                            |
| `genshin-party i`     | `/interactive` | Data layer ready: `GET /api/random-char` serves rolls. The xstate UI that drives it is still deferred. |

## Data layer (implemented)

`genshin-db` is Node-only, reads JSON from disk via `fs`, and is ~170 MB installed — far too large to bundle into a Vercel function. The data is also **static per `genshin-db` version**, not live state. So rather than query it at runtime, we extract it at build time:

- **`scripts/gen-data.ts`** (run via `pnpm gen:data`) imports `genshin-db`, trims it, and writes `src/lib/server/genshin/data/{characters,bosses}.json` (committed, ~44 KB each). `Aether` and `Stormterror` are excluded here, at extraction time.
- **`genshin-db` is a `devDependency`** — imported only by that script, never by runtime code, so it never reaches the Vercel bundle. Re-run `pnpm gen:data` when the `genshin-db` version is bumped.
- **`src/lib/server/genshin/index.ts`** loads the committed JSON once as a module and exposes pure functions: `getChars({ element, rarity })`, `getBosses({ weekly })`, `sample(items, count)`, and `randomChars(filters)` (mirrors the CLI's generator).
- The trim differs from the CLI: it **keeps** each character's `region` and full-URL `portrait`/`icon`/`fandomUrl` for the UI (the CLI drops `images`/`url`). Bosses are text-only — `genshin-db` exposes no usable image URL for enemies, only a bare icon filename.
- `Aloy`/`Lumine` exclusion (`onlyTeyvat`) stays at the call site (`/api/random-char`), same as the CLI's `interactive` command. They remain in the character data because `/char` may return them.

Surfaces:

- `src/routes/char/+page.server.ts` — form action: `getChars(...)` + `sample`.
- `src/routes/boss/+page.server.ts` — form action: `getBosses(...)` + `sample` (one or three).
- `src/routes/api/random-char/+server.ts` — `GET` returning JSON with `Cache-Control: no-store`; used by `/interactive`.

## Deferred work

### 1. `xstate` interactive flow

Mirrors `src/commands/interactive.ts` in the CLI:

1. On mount the page shuffles `[1,2,3,4]` and starts an actor.
2. For each player slot:
   - Rarity to roll is `4` if the previous accepted choice was marked `isMain`, else `5`.
   - Page polls `/api/random-char` until the candidate passes the `unique` filter.
   - User can `Accept`, `Accept as main` (disabled on the final pick), `Reroll`, or `Go back to Player N` (pops the last choice).
3. When four choices are committed, the actor enters `done` and the final party renders.

Wire-up points: a new `src/lib/player-selection-stack.ts` ports the CLI's xstate machine; `src/routes/interactive/+page.svelte` drives it.

### 2. Things further out

- **Player name input** — CLI accepts `-p name1,name2,…` and expands 1/2/3-player input into a 4-slot array. Web version will need a text input + duplicate-expansion logic.
- **Shareable results** — `?seed=…` query param to make rolls reproducible.
- **Visual polish** — intentional. Foundation only.
- **Staleness guard** — `pnpm gen:data` is run manually on `genshin-db` bumps. A CI check that regenerates and fails on a dirty diff would prevent the committed JSON drifting from the pinned version.

## Open questions for the next session

1. Should `/interactive` persist state in `sessionStorage` so a reload mid-party doesn't restart? Probably yes once the UX is fleshed out.
2. Add `@vercel/analytics` event tracking for which feature is used most.

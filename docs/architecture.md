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

| CLI command           | Web route      | Status                                                                                    |
| --------------------- | -------------- | ----------------------------------------------------------------------------------------- |
| `genshin-party char`  | `/char`        | Form skeleton only. Form action returns a TODO message — no `genshin-db` integration yet. |
| `genshin-party boss`  | `/boss`        | Form skeleton only. Form action returns a TODO message — no `genshin-db` integration yet. |
| `genshin-party order` | `/order`       | Working — pure shuffle, no data dependency.                                               |
| `genshin-party i`     | `/interactive` | Placeholder page only. State machine + roll endpoint deferred.                            |

## Deferred work

The CLI carries three domain dependencies that this foundation deliberately does **not** pull in yet. The shape they will take when added:

### 1. `genshin-db` data layer

`genshin-db` is Node-only — it reads from local JSON via `fs`. On Vercel we lose persistent disk between invocations, so the strategy will be:

- Imports of `genshin-db` confined to `src/lib/server/` (e.g. `src/lib/server/genshin-db.ts`). SvelteKit guarantees nothing under `$lib/server` ships to the browser.
- In-process memoization (a single-call cache) to keep the dataset warm across requests on a warm serverless instance. Cold starts re-load.
- Helpers to add: `getChars({ element, rarity })` (excluding `Aether`), `getBosses({ weekly })` (excluding `Stormterror`).
- `Aloy`/`Lumine` exclusion (`onlyTeyvat`) belongs at the call site, same as in the CLI's `interactive` command.

Wire-up points in this scaffold:

- `src/routes/char/+page.server.ts` — replace TODO return with `getChars(...)` + pick one.
- `src/routes/boss/+page.server.ts` — replace TODO return with `getBosses(...)` + pick one or three.
- `src/routes/api/random-char/+server.ts` (to be created) — used by `/interactive`.

### 2. `xstate` interactive flow

Mirrors `src/commands/interactive.ts` in the CLI:

1. On mount the page shuffles `[1,2,3,4]` and starts an actor.
2. For each player slot:
   - Rarity to roll is `4` if the previous accepted choice was marked `isMain`, else `5`.
   - Page polls `/api/random-char` until the candidate passes the `unique` filter.
   - User can `Accept`, `Accept as main` (disabled on the final pick), `Reroll`, or `Go back to Player N` (pops the last choice).
3. When four choices are committed, the actor enters `done` and the final party renders.

Wire-up points: a new `src/lib/player-selection-stack.ts` ports the CLI's xstate machine; `src/routes/interactive/+page.svelte` drives it.

### 3. Things further out

- **Player name input** — CLI accepts `-p name1,name2,…` and expands 1/2/3-player input into a 4-slot array. Web version will need a text input + duplicate-expansion logic.
- **Cache headers** — `/api/random-char` should set `Cache-Control: no-store`.
- **Shareable results** — `?seed=…` query param to make rolls reproducible.
- **Visual polish** — intentional. Foundation only.
- **`genshin-db` bundle size** — measure before optimizing. If the trimmed dataset bloats Vercel functions, pre-extract a JSON asset at build time and read from edge functions instead.

## Open questions for the next session

1. Does the `genshin-db` bundle bloat Vercel functions enough to warrant build-time extraction? Measure first.
2. Should `/interactive` persist state in `sessionStorage` so a reload mid-party doesn't restart? Probably yes once the UX is fleshed out.
3. Add `@vercel/analytics` event tracking for which feature is used most.

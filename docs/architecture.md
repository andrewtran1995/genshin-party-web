# Architecture — CLI ↔ Web mapping

`genshin-party-web` ports the four `genshin-party` CLI commands to a SvelteKit app on Vercel. This doc maps each CLI experience to its web equivalent, calls out the differences forced by the new medium, and lists what's stubbed vs. complete.

## Data layer

`genshin-db` is Node-only — it reads from local JSON files via `fs`. The CLI also caches results under `.cache/` between runs. On Vercel we lose persistent disk between invocations, so the strategy changes:

- Imports of `genshin-db` are confined to `src/lib/server/` (`src/lib/server/genshin-db.ts`). SvelteKit guarantees nothing under `$lib/server` ships to the browser.
- In-process memoization via `remeda`'s `once` keeps the dataset warm for the lifetime of each serverless instance. Cold starts re-load from the bundled package.
- Future optimization (not in this foundation): pre-extract the trimmed dataset at `vite build` time into a static JSON asset under `static/`, then read it from edge functions to avoid bundling all of `genshin-db`. Defer until bundle size becomes a real problem.

The shared filter helpers are:

- `getChars({ element, rarity })` — mirrors the CLI's `getChars`, including the `Aether` exclusion.
- `getBosses({ weekly })` — mirrors the CLI's boss filter, including the `Stormterror` exclusion.

`Aloy`/`Lumine` exclusion (`onlyTeyvat`) lives at the call site, same as in the CLI's `interactive` command.

## Route map

| CLI command           | Web route      | Implementation                                                                                                                       |
| --------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `genshin-party char`  | `/char`        | Form with `element` + `rarity` selects → `+page.server.ts` action calls `getChars()` and returns a single pick. Re-roll = re-submit. |
| `genshin-party boss`  | `/boss`        | Form with `gauntlet` (3 bosses) + `weekly` checkboxes → `+page.server.ts` action calls `getBosses()` and returns one or three picks. |
| `genshin-party order` | `/order`       | Single-button form → shuffles `[1,2,3,4]`. No data dependency.                                                                       |
| `genshin-party i`     | `/interactive` | Client-driven xstate machine (`src/lib/player-selection-stack.ts`) consumes rolls from `GET /api/random-char`. Mirrors the CLI flow. |

### `/interactive` flow (mirrors `src/commands/interactive.ts` in the CLI)

1. On mount, the page shuffles `[1,2,3,4]` and starts the actor.
2. For each player slot:
   - Rarity to roll is `4` if the previous accepted choice was marked `isMain`, else `5`.
   - The page polls `/api/random-char` until it has a candidate that passes the `unique` filter (no duplicate names already chosen).
   - User can `Accept`, `Accept as main` (disabled on the final pick), `Reroll`, or `Go back to Player N` (pops the last choice).
3. When four choices are committed, the actor enters `done` and the final party is rendered.

### Things deliberately omitted from this foundation

- **Player name input** — the CLI accepts `-p name1,name2,…` and expands 1/2/3-player input into a 4-slot array. The web version currently labels players by number only. Wire this up with a text input + duplicate-expansion logic when ready.
- **Element filter on interactive rolls** — CLI's interactive doesn't filter by element. Match that here; if we add it, decide product-side whether duplicates by element should also be deduped.
- **Cache headers** — `/api/random-char` returns fresh randomness, so it should be `Cache-Control: no-store`. Add when adding analytics or tightening security headers.
- **Shareable results** — adding an `?seed=…` query param to make a roll reproducible would let players share parties. Not in scope for the foundation.
- **Visual polish** — intentional. Foundation only.

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
| CI                | GitHub Actions, identical jobs to wedding-site minus the postgres service    |

## Open questions for the next session

1. Does the `genshin-db` bundle bloat Vercel functions enough to warrant build-time extraction? Measure first.
2. Should `/interactive` persist state in `sessionStorage` so a reload mid-party doesn't restart? Probably yes once the UX is fleshed out.
3. Add `@vercel/analytics` event tracking for which feature is used most, to guide where to invest in UX next.

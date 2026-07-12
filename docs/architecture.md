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

| CLI command           | Web route      | Status                                                                                                                                                                                                 |
| --------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `genshin-party char`  | `/char`        | Working — entry form filters via `$lib/genshin` and navigates to a pre-rendered `/char/[name]` result.                                                                                                 |
| `genshin-party boss`  | `/boss`        | Working — entry form picks one or three bosses via `$lib/genshin`, honoring gauntlet/weekly. Single bosses render at `/boss/[name]` (pre-rendered); gauntlets render at `/boss/[a]/[b]/[c]` (dynamic). |
| `genshin-party order` | `/order`       | Working — entry form shuffles `[1,2,3,4]` and navigates to a pre-rendered `/order/[permutation]` result.                                                                                               |
| `genshin-party i`     | `/interactive` | Working — client-side 4-player flow using `$lib/genshin` and `$lib/player-selection-stack.ts`.                                                                                                         |

## Data layer

`genshin-db` is Node-only, reads JSON from disk via `fs`, and is ~170 MB installed — far too large to bundle into a Vercel function. The data is also **static per `genshin-db` version**, not live state. So rather than query it at runtime, we extract it at build time:

- **`scripts/gen-data.ts`** (run via `pnpm gen:data`) imports `genshin-db`, trims it, and writes `src/lib/genshin/data/{characters,bosses}.json` (build artifacts, ~44 KB each). `Aether` and `Stormterror` are excluded here, at extraction time.
- **`genshin-db` is a `devDependency`** — imported only by that script, never by runtime code, so it never reaches the Vercel bundle. Re-run `pnpm gen:data` when the `genshin-db` version is bumped.
- **`src/lib/genshin/index.ts`** loads the JSON once as a module and exposes pure functions: `getChars({ element, rarity, includeTraveler, exclude })`, `getBosses({ weekly })`, `sample(items, count)`, `getRandomChar(...)`, `getRandomBoss(...)`, `getRandomBosses(...)`, and `randomChars(filters)` (mirrors the CLI's generator). This module is client-safe, so all randomization runs in the browser.
- The trim differs from the CLI: it **keeps** each character's `region` and full-URL `portrait`/`icon`/`fandomUrl` for the UI (the CLI drops `images`/`url`). Bosses are text-only — `genshin-db` exposes no usable image URL for enemies, only a bare icon filename.
- `Aloy`/`Lumine` exclusion (`includeTraveler: false`) stays at the call site (`/interactive`), same as the CLI's `interactive` command. They remain in the character data because `/char` may return them.

Surfaces:

- `src/routes/char/+page.svelte` — browser form intercept; `+page.server.ts` provides the no-JS fallback.
- `src/routes/char/[name]/+page.svelte` — pre-rendered result page.
- `src/routes/boss/+page.svelte` — browser form intercept; `+page.server.ts` provides the no-JS fallback.
- `src/routes/boss/[name]/+page.svelte` — pre-rendered single-boss result.
- `src/routes/boss/[a]/[b]/[c]/+page.svelte` — dynamic gauntlet result.
- `src/routes/order/+page.svelte` — browser form intercept; `+page.server.ts` provides the no-JS fallback.
- `src/routes/order/[permutation]/+page.svelte` — pre-rendered result page.
- `src/routes/interactive/+page.svelte` — client-side flow using `$lib/genshin` for rolls.

## Deferred work

- **Shareable results with a seed** — currently results use URL-based state but are not reproducible. A `?seed=…` query param could make rolls deterministic.
- **Visual polish** — intentional. Foundation only.
- **Staleness guard** — `pnpm gen:data` is run automatically on `build`/`dev`/`check`/`test`. A CI check that regenerates and fails on a dirty diff would prevent the generated JSON drifting from the pinned `genshin-db` version.

## Open questions for the next session

1. Should `/interactive` persist state in `sessionStorage` so a reload mid-party doesn't restart? Probably yes once the UX is fleshed out.
2. Add `@vercel/analytics` event tracking for which feature is used most.

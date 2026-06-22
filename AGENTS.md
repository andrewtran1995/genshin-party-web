# genshin-party-web — Agent Instructions

Web counterpart to the [`genshin-party`](https://www.npmjs.com/package/genshin-party) CLI. Hosts the same random pickers (character, boss, order, interactive party) as a Vercel-deployed SvelteKit app.

## Package manager

Always use `pnpm`. Never use `npm` or `yarn`.

## Scripts

Prefer existing `package.json` scripts over crafting custom commands. Check `pnpm run` before reaching for a manual CLI invocation.

## Stack

- SvelteKit 2 with Svelte 5 syntax (runes)
- `@sveltejs/adapter-vercel` — do not change the adapter

The data layer is wired in: `/char`, `/boss`, and `GET /api/random-char` are backed by a build-time-extracted dataset (see "Genshin data" below). `genshin-db` is a `devDependency` used only by the extraction script. `xstate` (the `/interactive` flow) is **still intentionally not installed** — that page remains a placeholder.

## Domain logic source of truth (when added)

The CLI at `../genshin-party/` (or [`genshin-party` on npm](https://www.npmjs.com/package/genshin-party)) is the original implementation. When porting a feature, mirror its behaviour rather than re-deriving it. See `docs/architecture.md` for the planned route-by-route mapping and the rules each port should preserve (e.g. `Aether`/`Stormterror` exclusions).

## Browser support

- `.browserslistrc` uses `defaults`. `vite.config.ts` feeds it into esbuild via `browserslist-to-esbuild`.
- Inspect with `pnpm exec browserslist`.

## Prerendering strategy

- `src/routes/+layout.ts` sets `prerender = false` because every feature route uses form actions or API endpoints backed by `genshin-db`.
- If a static informational page is added, opt it in with `export const prerender = true` in its own `+page.ts`.

## Pre-commit hooks

Husky runs these on every `git commit`:

1. `pnpm lint` — prettier + eslint + stylelint
2. `pnpm check` — svelte-check
3. `pnpm test:unit --run` — vitest unit tests

E2E tests (`pnpm test:e2e`) run in CI; they are too slow for pre-commit.

## Svelte 5 — runes only

- Use `$state()`, `$derived()`, `$effect()`, `$props()` exclusively
- NEVER use: `export let`, `$:`, `<slot>`, `createEventDispatcher`, `on:click` (use `onclick={handler}`)
- Use snippets (`{@render children?.()}`) — not slots
- `$effect` does NOT run during SSR

## SvelteKit conventions

- Server data + secrets → `+page.server.ts`. Universal load → `+page.ts`
- Form actions live in `+page.server.ts`. Use `fail()` for validation
- Domain helpers live in `src/lib/server/genshin/` so they never reach the browser bundle
- Keep route files thin — move logic to `$lib`

## Genshin data

`genshin-db` is ~170 MB and Node-only, and its data is static per version, so it is **not** queried at runtime. `scripts/gen-data.ts` trims it to small JSON files under `src/lib/server/genshin/data/`; `src/lib/server/genshin/index.ts` loads that JSON once and exposes `getChars`/`getBosses`/`randomChars`.

The generated JSON files are **not committed** — they are build artifacts listed in `.gitignore`. The `build`, `dev`, `check`, and `test:unit` scripts all invoke `gen:data` automatically as their first step, so a fresh checkout works without any manual data-generation step. After bumping `genshin-db`, the next run of any of those scripts will regenerate the data. Keep `genshin-db` a `devDependency` — never import it from runtime code.

## Style

- Composition over abstraction. Keep component hierarchies flat
- Behavioural tests, not implementation-mirroring tests

## Agent-specific configuration

- **Claude Code** reads `CLAUDE.md` (a shim to this file)

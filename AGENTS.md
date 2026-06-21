# genshin-party-web — Agent Instructions

Web counterpart to the [`genshin-party`](https://www.npmjs.com/package/genshin-party) CLI. Hosts the same random pickers (character, boss, order, interactive party) as a Vercel-deployed SvelteKit app.

## Package manager

Always use `pnpm`. Never use `npm` or `yarn`.

## Scripts

Prefer existing `package.json` scripts over crafting custom commands. Check `pnpm run` before reaching for a manual CLI invocation.

## Stack

- SvelteKit 2 with Svelte 5 syntax (runes)
- `@sveltejs/adapter-vercel` — do not change the adapter
- `genshin-db` for character/enemy data (server-only — pulls in Node `fs`)
- `remeda`, `ts-pattern`, `xstate` ported from the CLI

## Domain logic source of truth

The CLI at `../genshin-party/` (or [`genshin-party` on npm](https://www.npmjs.com/package/genshin-party)) is the original implementation. When porting a feature, mirror its behaviour rather than re-deriving it:

- Character filtering and exclusions (`Aether` always excluded; `Aloy`/`Lumine` excluded under `onlyTeyvat`) → `src/lib/server/genshin-db.ts`
- Interactive party state machine → `src/lib/player-selection-stack.ts` (xstate)
- Boss filtering (weekly + `Stormterror` exclusion) → `src/lib/server/genshin-db.ts`

See `docs/architecture.md` for the route-by-route mapping.

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
- `genshin-db` imports must live under `src/lib/server/` so they never reach the browser bundle
- Keep route files thin — move logic to `$lib`

## Style

- Composition over abstraction. Keep component hierarchies flat
- Behavioural tests, not implementation-mirroring tests

## Agent-specific configuration

- **Claude Code** reads `CLAUDE.md` (a shim to this file)

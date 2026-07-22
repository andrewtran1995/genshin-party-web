# genshin-party-web — Agent Instructions

Web counterpart to the [`genshin-party`](https://www.npmjs.com/package/genshin-party) CLI. Hosts the same random pickers (character, boss, order, interactive party) as a Vercel-deployed SvelteKit app.

## Package manager

Always use `pnpm`. Never use `npm` or `yarn`.

## Scripts

Prefer existing `package.json` scripts over crafting custom commands. Check `pnpm run` before reaching for a manual CLI invocation.

## Stack

- SvelteKit 2 with Svelte 5 syntax (runes)
- `@sveltejs/adapter-vercel` — do not change the adapter

The data layer is client-safe: `/char`, `/boss`, and `/order` roll from the browser using a build-time-extracted dataset loaded by `$lib/genshin`, while `/interactive` uses the same dataset via a Svelte 5 rune reducer in `$lib/player-selection-stack.ts`. `genshin-db` is a `devDependency` used only by the extraction script.

## Domain logic source of truth (when added)

The CLI at `../genshin-party/` (or [`genshin-party` on npm](https://www.npmjs.com/package/genshin-party)) is the original implementation. When porting a feature, mirror its behaviour rather than re-deriving it. See `docs/architecture.md` for the planned route-by-route mapping and the rules each port should preserve (e.g. `Aether`/`Stormterror` exclusions).

## Browser support

- `.browserslistrc` uses `defaults`. `vite.config.ts` feeds it into esbuild via `browserslist-to-esbuild`.
- Inspect with `pnpm exec browserslist`.

## Prerendering strategy

- Prerendering is opt-in per route. Result pages (`/char/[name]`, `/boss/[name]`, `/order/[permutation]`) are pre-rendered; entry forms and the `/interactive` flow are dynamic.
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
- Domain helpers live in `src/lib/genshin/` so they are available to both client pages and the no-JS fallback server actions
- Keep route files thin — move logic to `$lib`

## Genshin data

`genshin-db` is ~170 MB and Node-only, and its data is static per version, so it is **not** queried at runtime. `scripts/gen-data.ts` trims it to small JSON files under `src/lib/genshin/data/`; `src/lib/genshin/index.ts` loads that JSON once and exposes `getChars`/`getBosses`/`randomChars` plus helpers for client-side rolling.

The generated JSON files are **not committed** — they are build artifacts listed in `.gitignore`. The `build` and `prepare` scripts run `gen:data` automatically; `prepare` runs after `pnpm install`, so a fresh checkout works without any manual data-generation step. After bumping `genshin-db`, the next run of `build` or `prepare` will regenerate the data. Keep `genshin-db` a `devDependency` — never import it from runtime code.

## Style

- Composition over abstraction. Keep component hierarchies flat
- Behavioural tests, not implementation-mirroring tests

## Agent skills

Agent skills are managed with the [Skills CLI](https://skills.sh/) (`npx skills`) and are **vendored**: `.agents/skills/` is committed to the repository, so a checkout has working skills without a network fetch.

- `skills-lock.json` is the source of truth for which skills are installed and is tracked in git.
- `.agents/skills/` holds the actual vendored skill files (one directory per skill, matching the lockfile keys) and is also tracked in git.
- `pnpm skills:verify` (`scripts/verify-skills-lock.ts`) recomputes each vendored skill folder's hash and checks it against `skills-lock.json`'s `computedHash`, failing if a skill is missing, out of date, or vendored without a lockfile entry. This runs in CI (`.github/workflows/ci.yml`) so a lockfile bump without a re-vendor (or vice versa) fails the build.
- `pnpm skills:install` restores every skill listed in `skills-lock.json` into `.agents/skills/` (running `npx skills experimental_install`).
- `pnpm skills:sync` only installs the one extra skill not tracked in the lockfile (`pbakaus/impeccable`, via `npx skills add pbakaus/impeccable --all`) and symlinks/copies it into every detected agent directory, including `.claude/skills/`. Those per-agent copies/symlinks (`.claude/skills/`, `agent/skills/`) are regenerated, not committed.
- `pnpm skills:update` updates installed skills to their latest versions.

After changing `skills-lock.json` (e.g. via `skills:update`, or adding/removing a skill), re-vendor and verify before committing:

```bash
pnpm skills:install && pnpm skills:sync && pnpm skills:verify
```

Commit the resulting changes under `.agents/skills/` together with `skills-lock.json`.

**Caveat:** `skills:sync` does not wire lockfile-restored skills (e.g. `grill-me`) into `.claude/skills/` — only `pbakaus/impeccable` lands there, because it targets that one skill specifically rather than syncing the whole lockfile. A lockfile skill still exists under `.agents/skills/<name>/SKILL.md` and can be read/followed directly even when it isn't registered with the `Skill` tool.

## Agent-specific configuration

- **Claude Code** reads `CLAUDE.md` (a shim to this file)

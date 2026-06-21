# genshin-party-web

Web version of [`genshin-party`](https://www.npmjs.com/package/genshin-party) — random pickers for Genshin Impact multiplayer sessions, hosted on Vercel.

## Stack

- SvelteKit 2 + Svelte 5 (runes)
- `@sveltejs/adapter-vercel`
- `genshin-db` for character/enemy data
- Vitest + Playwright for testing
- ESLint + Prettier + Stylelint for static analysis

## Development

```sh
pnpm install
pnpm dev
```

## Scripts

| Command          | Purpose                       |
| ---------------- | ----------------------------- |
| `pnpm dev`       | Vite dev server               |
| `pnpm build`     | Production build for Vercel   |
| `pnpm preview`   | Preview the production build  |
| `pnpm check`     | `svelte-check` type checking  |
| `pnpm lint`      | Prettier + ESLint + Stylelint |
| `pnpm test:unit` | Vitest                        |
| `pnpm test:e2e`  | Playwright                    |

## Architecture

See [`docs/architecture.md`](./docs/architecture.md) for how each CLI feature maps to a web route.

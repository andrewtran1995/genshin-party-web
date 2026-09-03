# Spike: Effect vs. plain TypeScript for the icon-download pipeline

**This directory is a spike. Nothing here is wired into `pnpm gen:data`, `pnpm build`, or any
route.** It exists to give [`docs/adr/0002-effect-ts-for-backend-code.md`](../../../docs/adr/0002-effect-ts-for-backend-code.md)
something measurable to decide against, and it is kept — rather than deleted — so the next person
who asks "should we use Effect here?" gets the working comparison instead of the argument.

It is deliberately placed under `scripts/`, so the repo's own gates apply to it: `pnpm check`
typechecks it, `pnpm lint` lints it, and `pnpm test:unit` runs its tests on every commit. A spike
that quietly rots is worse than no spike.

## What is being compared

`scripts/lib/download.ts` fetches ~58 boss icons plus the element and weapon icons. It is 19 lines
and has none of the following, all of which a build step that hits the network should have:

1. **Retry** — one flaky 5xx from `gi.yatta.moe` fails the whole build.
2. **A concurrency cap** — `Promise.all` fires every icon request at one host simultaneously.
3. **A per-attempt timeout** — a hung socket hangs the build indefinitely.
4. **Whole-batch failure reporting** — `Promise.all` rejects on the first failure, so a build broken
   by six icons only ever tells you about one of them.

Separately, `scripts/gen-data.ts` casts the Yatta API response rather than checking it, so a shape
change there degrades the dataset silently instead of failing the build.

[`contract.ts`](./contract.ts) states those four guarantees as one interface.
[`effect-impl.ts`](./effect-impl.ts) and [`plain-impl.ts`](./plain-impl.ts) both implement it, and
[`contract.test.ts`](./contract.test.ts) runs a single behavioural suite against both. Same for the
API-shape problem: [`yatta-contract.ts`](./yatta-contract.ts) with an Effect `Schema` implementation
and a hand-written one, both held to [`yatta.test.ts`](./yatta.test.ts).

## Result

Both implementations pass the same suite, so the choice is about cost, not capability. Code lines,
comments and blanks stripped:

| Piece                     | Effect | Plain TS | Today                |
| ------------------------- | ------ | -------- | -------------------- |
| Download pipeline         | 46     | 67       | 19, no guarantees    |
| Yatta response validation | 22     | 24       | 0, an unchecked cast |

Effect is worth about 21 lines on the pipeline and roughly nothing on the validation. The shared
`contract.ts` (39 lines) is counted against neither, since both need it.

There is one behavioural divergence, pinned by the last two tests in `contract.test.ts`: the plain
timeout is an `AbortController` the transport has to honour, so a transport that ignores its signal
hangs the build with no timeout at all. Effect's timeout is enforced by the runtime interrupting the
fiber, so it holds either way. Real `fetch` honours the signal, so this is a robustness margin
rather than a live bug.

The comparison deliberately passes ports in as a plain object in both implementations rather than
using `Layer`/`Context`. The existing hand-rolled `DownloadDeps` already solves injection at this
scale in five lines, and dressing it up in Layers would have inflated the Effect side without buying
a capability the tests could show.

## Why `effect` is still in `devDependencies`

Only to keep this directory runnable. Nothing under `src/` imports it, and the ADR's build
measurement confirms it reaches neither the client bundle nor the Vercel function. Deleting this
directory and dropping the dependency is the intended way to reclaim the install weight if the
comparison stops earning its keep.

## Running it

```bash
pnpm exec vitest run scripts/spike
```

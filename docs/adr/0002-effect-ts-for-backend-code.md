# Use Effect in the build scripts, and nowhere else

We will use [Effect](https://effect.website/) for the build-time scripts under `scripts/`, where it
is a `devDependency` that ships nothing, and not in the route servers, `$lib`, or anywhere else
under `src/`.

The split is not a compromise. The two halves of this repo have opposite profiles: `scripts/` is
where all the real I/O lives — an external API and ~60 icon downloads — and `src/` has none at all,
because ADR 0001 moved every roll into the browser. Effect earns its keep in the first and would be
pure cost in the second.

## What "the backend" actually is here

Worth stating plainly, because it is smaller than the phrase suggests:

| Surface                            | Lines | What it does                                              |
| ---------------------------------- | ----- | --------------------------------------------------------- |
| `src/routes/char/+page.server.ts`  | 39    | A `load` and two form actions: parse `FormData`, redirect |
| `src/routes/boss/+page.server.ts`  | 16    | One form action: parse `FormData`, redirect               |
| `src/routes/order/order.remote.ts` | 7     | One remote `form()`: redirect                             |

No database, no runtime external API, no auth, no secrets (`.env.example` says so), no queue, no
transactions. The only `await` is `request.formData()`. Each is a no-JS fallback whose JavaScript
path does the same work in the browser.

The I/O-shaped code is all at build time, in `scripts/`: `gen-data.ts` calls the Yatta monster API
and downloads ~58 boss icons plus element and weapon icons.

## Why not `src/`: the cost is disqualifying

Measured on this repo, `effect@3.22.1`, `pnpm build` from clean:

| Build                                  | Client JS (raw) | Client JS (gzip) | Vercel function |
| -------------------------------------- | --------------- | ---------------- | --------------- |
| Baseline                               | 369,512 B       | 129,584 B        | 1,131,261 B     |
| Effect used in a `$lib/genshin` module | 486,344 B       | 166,412 B        | 9,579,720 B     |
| Effect used only in `+page.server.ts`  | 369,512 B       | 129,584 B        | 9,579,614 B     |

Two things fall out of that table.

**Effect in `$lib` ships to the browser.** The domain modules are shared by the server actions and
the client pages by design — that sharing is the whole point of ADR 0001. Putting Effect behind
`rollBossUrl` grew the chunk `/boss` loads from 45 KB to 162 KB: **+36.8 KB gzipped across the
client, a 28% increase**, on the mobile connections this app is mostly opened from. Bounty 005 spent
three runs splitting barrel files to save a fraction of that.

**Server-only use avoids the browser but not the function.** Vite externalizes `node_modules` for
SSR, so the adapter traces the package into the deployed function whole: 724 files, 7.56 MB, taking
the function from 1.13 MB to 9.58 MB — **8.5×**. Nothing shrinks it, because tracing follows
`effect`'s barrel rather than the handful of names actually imported.

Set against that: the code being wrapped is ~62 lines, synchronous, and its failure modes
(`no match → fail(404)`, `invalid selection → fail(400)`) are already modelled by `fail`/`redirect`.
Typed errors, dependency injection, retries, and interruption are answers to problems these files do
not have.

## Why `scripts/`: it ships nothing, and the gaps were real

A `devDependency` imported only from `scripts/` reaches neither the browser nor the function.
Confirmed, not assumed — after this change, `pnpm build` produces a client bundle of 369,512 B and a
Vercel function of 1,131,261 B, both identical to baseline, with zero `effect` files traced and no
Effect code found in any emitted chunk.

What `scripts/lib/download.ts` was missing, in 19 lines built on `Promise.all`:

1. **Retry** — one flaky 5xx from `gi.yatta.moe` failed the whole build.
2. **A concurrency cap** — every icon request fired at one host simultaneously.
3. **A per-attempt timeout** — a hung socket hung the build indefinitely.
4. **Whole-batch reporting** — `Promise.all` rejects on the first failure, so a build broken by six
   icons named one of them.

And `gen-data.ts` cast the Yatta response rather than checking it, so a rename of `icon` or a move of
`items` would have left the icon map empty, silently degrading the shipped dataset instead of
failing.

Before choosing, both designs were built to those four guarantees behind one interface and run
against a single behavioural suite. Both passed, so the decision came down to cost. Code lines,
comments and blanks stripped:

| Piece                     | Effect | Plain TS | Before               |
| ------------------------- | ------ | -------- | -------------------- |
| Download pipeline         | 46     | 67       | 19, no guarantees    |
| Yatta response validation | 22     | 24       | 0, an unchecked cast |

Effect is worth about 21 lines on the pipeline and roughly nothing on the validation — plus one
guarantee the plain version cannot make: its timeout is enforced by the runtime interrupting the
fiber, whereas an `AbortController` timeout is only as good as the transport's willingness to honour
a signal. `scripts/lib/http.test.ts` pins both behaviours.

## What this looks like in the tree

- **`scripts/lib/http.ts`** — `fetchAndRead`, the one primitive both callers use: bounded per
  attempt, retried on transient failures (5xx and transport errors, never a 4xx), with the body read
  inside the retry so a connection that drops mid-download is retried rather than reported.
- **`scripts/lib/download.ts`** — `downloadAll`, capped at 8 concurrent requests, running the whole
  batch before failing so `DownloadFailures` names every icon that could not be fetched.
- **`scripts/lib/yatta.ts`** — the monster index behind a `Schema`, so a shape change is a named,
  loud warning instead of an empty map.
- **`scripts/gen-data.ts`** — unchanged in shape: still a top-level-`await` script, now calling
  `Effect.runPromise` at its two I/O boundaries. Deliberately not converted wholesale; the rest of it
  is synchronous data munging that Effect would only make longer.

Verified end to end: regenerating from scratch produces byte-identical `characters.json`,
`bosses.json`, `data-size.json`, and all 70 icons, including a run that deleted icons to force real
downloads and a live Yatta fetch through the new decoder.

## Boundaries

- **Do not import `effect` from `src/`.** That is what the first table costs.
- `effect` stays in `devDependencies`, alongside `genshin-db`, for the same reason: build-time only,
  never runtime.
- `scripts/lib/icon-plan.ts`, `trim.ts`, and `size-report.ts` stay plain. They are pure functions
  over in-memory data with no failure modes worth typing; the one `throw` in `planIconDownloads` is
  a data error that should fail the build loudly and already does.

## When to reopen the `src/` half

Effect's case rests on orchestration, and there is nothing in `src/` to orchestrate. Reopen if that
changes:

- a database, a request-time external API, auth, or a job queue enters the runtime;
- server-side work grows past a few dozen lines with more than one real failure mode;
- Vercel's tracing learns to prune an externalized package to its used exports, which would take the
  8.5× function penalty off the table.

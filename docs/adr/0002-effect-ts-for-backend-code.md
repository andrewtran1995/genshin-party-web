# Do not adopt Effect; fix the gaps it was being considered for

We will not adopt [Effect](https://effect.website/) in this repo — not in the route servers, not in
`$lib`, and not in the build scripts. The problems that prompted the question are real, but they are
in `scripts/`, they are worth about twenty lines of Effect over plain TypeScript, and they do not
justify the dependency.

The working comparison this decision rests on is kept at
[`scripts/spike/download-pipeline/`](../../scripts/spike/download-pipeline/), under the repo's own
lint, typecheck, and test gates. Re-run it before overturning this.

## What "the backend" actually is here

Worth stating plainly, because it is smaller than the phrase suggests. ADR 0001 moved randomization
into the browser and put results in the URL, which left the server with almost nothing:

| Surface                            | Lines | What it does                                              |
| ---------------------------------- | ----- | --------------------------------------------------------- |
| `src/routes/char/+page.server.ts`  | 39    | A `load` and two form actions: parse `FormData`, redirect |
| `src/routes/boss/+page.server.ts`  | 16    | One form action: parse `FormData`, redirect               |
| `src/routes/order/order.remote.ts` | 7     | One remote `form()`: redirect                             |

No database, no runtime external API, no auth, no secrets (`.env.example` says so), no queue, no
transactions. The only `await` is `request.formData()`. Every one of these is a no-JS fallback whose
JavaScript path does the same work in the browser.

The genuinely I/O-shaped code is at build time, in `scripts/`: `gen-data.ts` calls the Yatta API and
downloads ~58 boss icons plus element and weapon icons, through `scripts/lib/download.ts`.

## Runtime: the cost is disqualifying

Measured on this repo, `effect@3.22.1`, `pnpm build` from clean:

| Build                                  | Client JS (raw) | Client JS (gzip) | Vercel function |
| -------------------------------------- | --------------- | ---------------- | --------------- |
| Baseline                               | 369,512 B       | 129,584 B        | 1,131,261 B     |
| Effect used in a `$lib/genshin` module | 486,344 B       | 166,412 B        | 9,579,720 B     |
| Effect used only in `+page.server.ts`  | 369,512 B       | 129,584 B        | 9,579,614 B     |

Two things fall out of that table.

**Effect in `$lib` ships to the browser.** The domain modules are shared by the server actions and
the client pages by design — that sharing is the whole point of ADR 0001. Putting Effect behind
`rollBossUrl` grew the chunk `/boss` loads from 45 KB to 162 KB, or **+36.8 KB gzipped across the
client, a 28% increase**, on the mobile connections this app is mostly opened from. Bounty 005 spent
three runs splitting barrel files to save a fraction of that. This would hand it all back for
control flow over code with no I/O in it.

**Server-only use avoids the browser but not the function.** Vite externalizes `node_modules` for
SSR, so the adapter traces the package into the deployed function whole: 724 files, 7.56 MB, taking
the function from 1.13 MB to 9.58 MB — **8.5×**. Nothing shrinks it, because tracing follows
`effect`'s barrel rather than the handful of names actually imported.

Set against that: the code being wrapped is ~55 lines, synchronous, and its failure modes (`no
match → fail(404)`, `invalid selection → fail(400)`) are already modelled by `fail`/`redirect`.
Typed errors, dependency injection, retries, and interruption are all answers to problems these
files do not have.

## Build scripts: no shipping cost, but not worth the dependency either

A `devDependency` imported only from `scripts/` never reaches the browser or the function. Confirmed,
not assumed — building with the spike present and `effect` installed produced a client bundle and a
Vercel function byte-identical to baseline (369,512 B and 1,131,261 B), with zero `effect` files
traced. So the bundle argument does not apply here, and this is where the question deserved a real
answer rather than a reflex.

The gaps are real. `scripts/lib/download.ts` is 19 lines with no retry (one flaky 5xx fails the
build), no concurrency cap (`Promise.all` fires ~58 requests at one host at once), no per-attempt
timeout (a hung socket hangs the build), and no whole-batch reporting (`Promise.all` rejects on the
first failure, so a build broken by six icons names one). `gen-data.ts` casts the Yatta response
instead of checking it, so a shape change there degrades the dataset silently.

So the spike implements all four guarantees twice — once in Effect, once in plain TypeScript — and
runs one behavioural suite against both. Both pass. Code lines, comments and blanks stripped:

| Piece                     | Effect | Plain TS | Today                |
| ------------------------- | ------ | -------- | -------------------- |
| Download pipeline         | 46     | 67       | 19, no guarantees    |
| Yatta response validation | 22     | 24       | 0, an unchecked cast |

Effect buys **21 lines** on the pipeline and **two** on the validation. `Schedule.exponential`
piped through `jittered` and `recurs` is nicer than a backoff loop, and `Effect.partition` with a
`concurrency` option is much nicer than a hand-rolled worker pool — but "nicer, by twenty lines, in
one file" does not carry a 34 MB dependency and its concept surface into a repo whose entire runtime
dependency list is `remeda` and `ts-pattern`.

One point genuinely goes to Effect: its timeout is enforced by the runtime interrupting the fiber,
whereas the plain timeout is an `AbortController` the transport has to honour. A transport that
ignores its signal hangs the build with no timeout at all. Both tests are in the spike. Real `fetch`
honours the signal, so this is a robustness margin rather than a live bug.

## What we do instead

Fix the four gaps in `scripts/lib/download.ts` in plain TypeScript, and replace the Yatta cast with
a hand-written check. The spike's `plain-impl.ts` and `yatta-plain.ts` are working implementations of
exactly that, and `contract.test.ts` is the suite they have to keep passing. That is roughly 48 lines
against the 27 Effect would have cost — a fair price for not taking the dependency.

## The one cost this decision does keep

`effect` stays in `devDependencies`. It is there for the spike and nothing else: no `src/` file and
no shipped script imports it, and the build measurement above confirms it reaches neither the client
bundle nor the Vercel function. What it does cost is install weight — 34 MB unpacked — on every
`pnpm install`, in exchange for a decision that can be re-measured instead of re-argued.

That is a deliberate trade and an easy one to reverse: deleting `scripts/spike/download-pipeline/`
and dropping the dependency leaves this ADR standing on its recorded numbers alone.

## When to reopen this

The measurements above are about a repo with no runtime I/O. Effect's case rests on orchestration —
typed error channels, resource safety, retries, interruption, structured concurrency — and there is
nothing here to orchestrate. Reopen if that changes:

- a database, a request-time external API, auth, or a job queue enters the runtime;
- server-side work grows past a few dozen lines with more than one real failure mode;
- Vercel's tracing learns to prune an externalized package to its used exports, which would take the
  8.5× function penalty off the table.

Adopting Effect for one build script now, in the hope of the first of those arriving, is the
speculative-generality trade this codebase's "composition over abstraction" line already refuses.

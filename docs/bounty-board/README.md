# Bounty board

A standing list of _classes_ of improvement to this repo, each described in its own file under
[`bounties/`](./bounties). An agent that can check out the repo picks one bounty per run, ships the
smallest useful slice of it as a pull request, drives that PR's CI to green, and then sharpens the
board itself.

A bounty is not a ticket. It is an ongoing focus that survives being worked: "accessibility gaps in
interactive components" stays open after one component is fixed, carrying a findings log of what has
already been swept.

## How a run starts

A Routine fires a fresh session every morning at 07:00 Pacific with the prompt in
[Routine prompt](#routine-prompt). Nothing carries over between runs — the board in the checkout is
the entire memory, which is why step 8 is not optional.

A human can start a run the same way: paste that prompt into a session with the repo checked out.

## The run

### 1. Orient

Read this file and list `docs/bounty-board/bounties/`. Fetch the remote and list open pull requests
whose branch starts with `bounty/`, so you can tell which bounties already have work in flight.

### 2. Pick one bounty, at random

Eligible bounties are those with `status: open` and no open `bounty/` pull request against them.
Choose uniformly at random among the eligible ones — do not prefer the easiest, the oldest, or the
one you would have picked. Random selection is what keeps the whole board moving instead of the same
two entries.

Write the chosen bounty's `status` to `in-progress` as your first commit on the branch, so a
concurrent run skips it.

If nothing is eligible, skip to step 8: the board still gets a pass, and "no eligible bounty" is
itself worth recording.

### 3. Scope the slice

Read the bounty in full, then go find the real instances in the codebase — the bounty names a class,
not a location. Pick the smallest coherent slice that satisfies at least one of the bounty's exit
criteria end to end. One component, one route, one rule. A slice you cannot describe in a sentence is
too big.

If the bounty's exit criteria turn out to be unmeasurable against the actual code, stop working and
go to step 8 to fix the spec. A vague bounty is a bug in the board, and fixing it is a complete run.

### 4. Do the work

Branch from the default branch as `bounty/<bounty-file-stem>` — the bounty file's name without `.md`,
so `002-accessibility.md` becomes `bounty/002-accessibility`. Follow
[`AGENTS.md`](../../AGENTS.md) for everything about how this codebase is written; this file only
governs the board.

Honour the bounty's own `Guardrails` section. There is deliberately no global guardrail list yet — if
a run discovers the board needs one, that is exactly the kind of change step 8 exists for.

### 5. Verify locally

Run, and require green before pushing:

```bash
pnpm lint
pnpm check
pnpm test:unit --run
```

The pre-commit hook runs these too, so a commit that fails them will not land in the first place.

### 6. Open the pull request

Title it `[bounty] <bounty title>`. In the body, name the bounty file, state the slice you took, and
list which exit criteria this PR satisfies and which remain.

**If the run has no GitHub tooling** — scheduled runs may fire without MCP or CLI access to GitHub —
push the branch anyway, then say in your final message that the branch is pushed and needs a PR
opened by hand. Step 7 is unreachable without that tooling; step 8 is not, and still runs.

### 7. Drive CI to green

Subscribe to the PR's activity (`subscribe_pr_activity`) rather than polling, then act on every check
failure: diagnose it, fix it, push again. The run is not finished while its own PR is red.

**Stop condition:** if the same check fails twice on fixes you pushed, stop pushing. Comment on the
PR with the failing check, the log excerpt, and what you tried, and leave it for a human. Two failed
fixes means the diagnosis is wrong, and a third guess costs more than it recovers.

Local verification in step 5 is what makes this cheap: CI should mostly be confirming what you
already know. A check that fails here but passed there is worth a findings-log line either way — it
means the local gate has a hole in it.

### 8. Update the board — required

Do this on every run, including runs where the fix failed, the bounty was unworkable, or nothing was
eligible. Commit it to the same branch so it rides the same PR.

1. **Sharpen the bounty you worked.** Tighten exit criteria that turned out vague, correct scope that
   pointed at the wrong paths, and append what you swept to its findings log. Reset `status` to
   `open` (or `done` — see below), bump `runs`, and set `last-run`.
2. **Retire what is exhausted.** A bounty whose exit criteria are all met is `done`. One that no
   longer describes this codebase is `retired`, with a findings-log line saying why.
3. **File what you noticed.** Real problems you saw in passing and did not fix become new bounty
   files — if they are a recurring class. A single one-off defect is a PR or an issue, not a bounty.
4. **Fix this file.** Any place where these instructions were ambiguous, wrong, or missing a step you
   had to invent — change them here, now, while you still remember the friction.

**Completion criterion:** at least one file under `docs/bounty-board/` is modified by this run. If
genuinely nothing changed, append a `no-change` line to the worked bounty's findings log saying what
you considered and why it stood — which is itself a modification. A run that touches no board file
has not finished.

## Bounty file contract

Copy [`TEMPLATE.md`](./TEMPLATE.md) to create one. Filenames are `<3-digit id>-<slug>.md`, and the
`id` in the frontmatter must match the filename's prefix.

| Key        | Values                                   | Meaning                                       |
| ---------- | ---------------------------------------- | --------------------------------------------- |
| `id`       | three digits                             | Stable identity; never reused after retiring. |
| `title`    | free text                                | Used verbatim in the PR title.                |
| `status`   | `open`, `in-progress`, `done`, `retired` | Eligibility for selection.                    |
| `size`     | `S`, `M`, `L`                            | Rough size of one slice, not of the bounty.   |
| `last-run` | `never` or `YYYY-MM-DD`                  | Date the bounty was last worked.              |
| `runs`     | integer                                  | How many runs have worked it.                 |

`scripts/bounty-board.test.ts` enforces the frontmatter and the required section headings on every
`pnpm test:unit` run, so a run that corrupts the board fails its own pre-commit hook. Change the
template's headings and you must change that test with them.

## Routine prompt

The standalone prompt the scheduled Routine sends, reproduced here so it can be rebuilt or edited:

> Run one bounty from this repo's bounty board. Read `docs/bounty-board/README.md` and follow it
> exactly: pick an eligible bounty at random, ship the smallest useful slice as a pull request on a
> `bounty/<file-stem>` branch, drive that PR's CI to green, and complete the required board update in
> step 8 before you finish.

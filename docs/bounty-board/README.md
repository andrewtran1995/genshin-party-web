# Bounty board

A standing list of _classes_ of improvement to this repo, each described in its own file under
[`bounties/`](./bounties). An agent that can check out the repo picks one work item per run — a bounty
here or an open GitHub issue — ships the smallest useful slice of it as a pull request, drives that
PR's CI to green, and then sharpens the board itself.

A bounty is not a ticket. It is an ongoing focus that survives being worked: "accessibility gaps in
interactive components" stays open after one component is fixed, carrying a findings log of what has
already been swept.

A run draws from two pools: the bounties in this directory, and the repo's **open GitHub issues**. A
bounty is a standing class of work; an issue is one specific piece of it, usually filed by a human or
by an earlier run that noticed something in passing. Both are eligible, both are picked the same way,
and both end in a pull request — where they differ is set out in
[Bounties and issues](#bounties-and-issues).

## Bounties and issues

|             | Bounty                                        | GitHub issue                             |
| ----------- | --------------------------------------------- | ---------------------------------------- |
| Shape       | A standing class that survives being worked   | One specific change, done when it's done |
| Lives in    | `bounties/<id>-<slug>.md`, tracked in git     | The repo's issue tracker                 |
| Claimed by  | `status: in-progress`, committed first        | Pushing the `issue/<number>-…` branch    |
| Branch      | `bounty/<file-stem>`                          | `issue/<number>-<slug>`                  |
| PR title    | `[bounty] <bounty title>`                     | `[issue] <issue title>`                  |
| Finished by | Meeting every exit criterion → `status: done` | `Closes #<number>` in the PR body        |

They convert into each other, and a run should say so when it sees the need:

- A recurring class you keep hitting while working issues is a **new bounty** — file it in step 8.
- A one-off defect you notice while working a bounty is an **issue**, not a new bounty file. The
  board's job is classes; the tracker's job is instances.

## How a run starts

A Routine fires a fresh session every morning at 07:00 Pacific with the prompt in
[Routine prompt](#routine-prompt). Nothing carries over between runs — the board in the checkout and
the issue tracker are the entire memory, which is why step 8 is not optional.

A human can start a run the same way: paste that prompt into a session with the repo checked out.

## The run

### 1. Orient

Read this file and list `docs/bounty-board/bounties/`. Then list the repo's **open GitHub issues** —
that is the other half of the pool, and an issue body usually carries scope and guardrails a bounty
would make you go and derive.

Fetch the remote and list open pull requests whose branch starts with `bounty/` or `issue/`, so you
can tell what already has work in flight.

If the run has no GitHub tooling — scheduled runs may fire without MCP or CLI access — say so, work
from the bounties alone, and record the gap in step 8. A run that cannot read the tracker does not
get to proceed as though there were nothing in it.

### 2. Pick one work item, at random

The eligible pool is both pools together:

- **Bounties** with `status: open` and no open `bounty/` pull request against them.
- **Open issues** with no open pull request and no pushed `issue/<number>-…` branch against them.

Choose uniformly at random across the combined pool — not bounties first, and not the easiest, the
newest, or the one you would have picked. Favouring one pool over the other is the same mistake as
always picking the same two bounties. An index or tracking issue that only links to other issues is
not itself work: skip it and treat the issues it links as the eligible ones.

Claim what you picked before working it, so a concurrent run skips it:

- A bounty: write its `status` to `in-progress` as your first commit on the branch.
- An issue: push the `issue/<number>-<slug>` branch as soon as you have one commit on it.

If nothing is eligible, skip to step 8: the board still gets a pass, and "nothing eligible" is itself
worth recording.

### 3. Scope the slice

**A bounty:** read it in full, then go find the real instances in the codebase — the bounty names a
class, not a location. Pick the smallest coherent slice that satisfies at least one of its exit
criteria end to end. One component, one route, one rule. A slice you cannot describe in a sentence is
too big.

If the bounty's exit criteria turn out to be unmeasurable against the actual code, stop working and
go to step 8 to fix the spec. A vague bounty is a bug in the board, and fixing it is a complete run.

**An issue:** the body is the scope, and whatever catches or guardrails it names bind the same way a
bounty's `Guardrails` section does. Verify its claims against the code before building on them — an
issue can be stale, and one filed by an earlier agent run can simply be wrong. If it is wrong, say so
on the issue and close it: a correction with evidence is a complete run.

If the issue is bigger than one slice, take the slice and leave the rest — say in the PR what you
took and what remains, and leave the issue open. Only `Closes #<number>` when it really is done.

Either way, check whether what you picked relates to a bounty; issues filed from a sweep usually name
one. If it does, that bounty's findings log is where step 8 goes.

### 4. Do the work

Branch from the default branch:

- A bounty → `bounty/<bounty-file-stem>`, the file's name without `.md`, so `002-accessibility.md`
  becomes `bounty/002-accessibility`.
- An issue → `issue/<number>-<slug>`, so issue 74 becomes `issue/74-vercel-image-optimization`.

Follow [`AGENTS.md`](../../AGENTS.md) for everything about how this codebase is written; this file
only governs the board.

Honour the bounty's own `Guardrails` section, or the issue's stated catches. There is deliberately no
global guardrail list yet — if a run discovers the board needs one, that is exactly the kind of
change step 8 exists for.

### 5. Verify locally

Run, and require green before pushing:

```bash
pnpm lint
pnpm check
pnpm test:unit --run
```

The pre-commit hook runs these too, so a commit that fails them will not land in the first place.

### 6. Open the pull request

- A bounty → title it `[bounty] <bounty title>`. In the body, name the bounty file, state the slice
  you took, and list which exit criteria this PR satisfies and which remain.
- An issue → title it `[issue] <issue title>`. In the body, state the slice you took, and either
  `Closes #<number>` if the issue is fully addressed or a line saying what remains if it is not.

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

Do this on every run, including runs where the fix failed, the item was unworkable, or nothing was
eligible. Commit it to the same branch so it rides the same PR.

1. **Sharpen the bounty you worked.** Tighten exit criteria that turned out vague, correct scope that
   pointed at the wrong paths, and append what you swept to its findings log. Reset `status` to
   `open` (or `done` — see below), bump `runs`, and set `last-run`. **On an issue run**, do the same
   for the bounty that issue relates to, if there is one — a findings-log line naming the issue is
   what keeps the board aware of work that happened outside it.
2. **Retire what is exhausted.** A bounty whose exit criteria are all met is `done`. One that no
   longer describes this codebase is `retired`, with a findings-log line saying why.
3. **File what you noticed.** Real problems you saw in passing and did not fix become new work: a
   recurring _class_ is a new bounty file here, and a single one-off defect is a GitHub issue. Filing
   in the wrong place is how the board silts up — classes here, instances in the tracker.
4. **Fix this file.** Any place where these instructions were ambiguous, wrong, or missing a step you
   had to invent — change them here, now, while you still remember the friction.

**Completion criterion:** a run must leave a durable record of itself somewhere the next run will
read. On a bounty run that means at least one modified file under `docs/bounty-board/`; if genuinely
nothing changed, append a `no-change` line to the worked bounty's findings log saying what you
considered and why it stood — which is itself a modification. On an issue run it means the issue
carries a comment (or a closing PR) saying what was done and what remains, plus whatever board file
item 1 called for. A run that leaves neither has not finished.

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

> Run one item from this repo's bounty board. Read `docs/bounty-board/README.md` and follow it
> exactly: pick one eligible work item at random from the combined pool of open bounties **and** open
> GitHub issues, ship the smallest useful slice as a pull request on the branch that item's kind
> calls for, drive that PR's CI to green, and complete the required step 8 record before you finish.

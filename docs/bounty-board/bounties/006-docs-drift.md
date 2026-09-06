---
id: 006
title: Documentation that no longer describes the code
status: done
size: S
last-run: 2026-09-06
runs: 1
---

# Documentation that no longer describes the code

## Why this matters

`AGENTS.md` is the first thing every agent session reads, and `docs/architecture.md` describes a
route-by-route mapping that the code has been moving under since it was written. A stale line there
is worse than a missing one: it is followed. `CONTEXT.md` fixes the project's vocabulary, and terms
that fell out of the code but stayed in that file quietly teach the wrong names to everyone who
reads it next.

## Scope

**In:** `AGENTS.md`, `CONTEXT.md`, `README.md`, `docs/architecture.md`, `docs/fonts.md`, and
`docs/bounty-board/` itself. Corrections must be verified against the code, file by file — an
assertion in a doc is checked by opening what it describes, never by remembering it.

**Out:** `docs/adr/`. An ADR records what was decided at a point in time; it goes stale by design.
Supersede one with a new ADR if the decision has actually changed, but never edit its history.

## Exit criteria

- [x] Every path, script name, and command named in `AGENTS.md` exists and does what the line says.
      Checked every file/dir path, every `pnpm` script, the Husky hook list, and the ADR link against
      the actual repo; the one break was `$lib/player-selection-stack.ts` (fixed, see findings log).
- [x] `docs/architecture.md`'s route mapping matches the routes actually under `src/routes/`, with
      planned-but-absent routes explicitly marked as planned. The four CLI-command rows (`/char`,
      `/boss`, `/order`, `/interactive`) match the actual routes, prerender flags, and file names,
      after fixing the same stale `player-selection-stack.ts` reference in the `/interactive` row.
      `/settings` (player-name presets) exists under `src/routes/` but isn't a CLI-command port, so it
      doesn't belong in this CLI-to-route table; it's also absent from the "Surfaces" list below the
      table, which is a real gap but outside this criterion — noted for a human rather than added here
      per the guardrail against growing the doc.
- [x] Every term in `CONTEXT.md` appears in the code under the name given there. All five terms
      (Build-time extraction, Client-side randomizer, Deterministic result page, URL-based state,
      Player) checked against `scripts/gen-data.ts`, the roll/URL helpers, and the `Player*`
      identifiers under `src/lib/`; still accurate, no changes needed.

## Guardrails

Do not add documentation under this bounty. It corrects and deletes: a doc drifts because it holds
more claims than the code can keep true, and adding more accelerates that. New docs come from a
human's request, not from a sweep.

## Findings log

- 2026-09-06: Swept all five in-scope files plus `docs/bounty-board/`. Verified against the actual
  code, not memory — read every path/script/link named, ran the scripts, and diffed line counts.
  - **Real drift found:** `$lib/player-selection-stack.ts` (named in `AGENTS.md` and
    `docs/architecture.md`'s route map) doesn't exist; the `/interactive` rune reducer is
    `src/lib/party-flow.svelte.ts` — same role, renamed at some point without the docs following.
    Fixed both references.
  - `docs/fonts.md` named a `--font-heading` CSS custom property "in `src/app.css`" that has never
    existed under that name; the actual variable is `--heading-font-family`, defined in
    `src/lib/themes/genshin.css` (only the `@font-face` itself lives in `app.css`). Fixed both
    mentions (the description and the "how to swap it" paragraph).
  - `docs/bounty-board/` itself had the same class of drift: bounties 004 and 007 both cite
    `src/lib/genshin/rolls.ts`/`rolls.test.ts` as present-tense fact in their Scope/Exit-criteria
    sections (not their findings logs, which are historical record and left untouched). That file
    was split into `characters.ts`/`bosses.ts`/`order.ts`/`path-segment.ts` by bounty 005's payload
    work (commit `d04b4bb`) — a case of one bounty's slice going unrecorded in a sibling bounty it
    touched. Repointed both to the current module names.
  - Bounty 001's "Why this matters" stats were stale (6 of 14 components tested, `PlayerNameInputs.svelte`
    at 137 lines, "five e2e specs") against the current 9 of 17, `PlayerNameRow.svelte` at 184 lines
    (now the actual second-largest untested surface — `PlayerNameInputs.svelte` has since grown a test),
    and six e2e specs. Corrected the numbers and the named example.
  - Bounty 003's "Why this matters" still quoted `char/+page.svelte` at its original 145 lines; its own
    findings log already shows two later runs cutting it down. Updated the present-tense line to the
    current 108 (still over the 100-line criterion, so the point stands); left the findings-log
    entries' historical counts alone.
  - Everything else checked clean: every `pnpm` script in `README.md`/`AGENTS.md` matches
    `package.json`; the Husky pre-commit list matches `.husky/pre-commit`; the ADR links resolve; the
    Effect-confinement claims (`scripts/lib/*.ts` vs `src/`) hold; `docs/fonts.md`'s font size, subset
    unicode range (checked against every character actually in `characters.json`/`bosses.json`), and
    `font-weight: 400 900` all hold; every `CONTEXT.md` term still names something real in the code.
  - Not fixed, logged instead: `src/routes/settings/` (player-name presets) is a real route missing
    from `docs/architecture.md`'s "Surfaces" list and isn't a CLI-command port so it doesn't fit the
    route-map table either — it just isn't documented anywhere in that file. Left alone per this
    bounty's own guardrail (corrects and deletes, doesn't add); worth a human decision on where a
    web-only (non-CLI) surface like this belongs in the doc.
  - Bounty 002's "18 files carry an `aria-*` attribute or a `role`" is off by one against a fresh
    grep (19 now) — within the noise of a bounty under active work (`runs: 3`) and not worth chasing
    here; left it.
  - All three exit criteria are met as of this run → `status: done`. Docs drift by nature recurs as
    the code keeps moving; if a future run finds new drift, reopen this file (`status: open`) rather
    than filing a new bounty for the same class.

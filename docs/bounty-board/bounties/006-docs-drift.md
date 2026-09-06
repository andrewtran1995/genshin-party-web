---
id: 006
title: Documentation that no longer describes the code
status: in-progress
size: S
last-run: never
runs: 0
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

- [ ] Every path, script name, and command named in `AGENTS.md` exists and does what the line says.
- [ ] `docs/architecture.md`'s route mapping matches the routes actually under `src/routes/`, with
      planned-but-absent routes explicitly marked as planned.
- [ ] Every term in `CONTEXT.md` appears in the code under the name given there.

## Guardrails

Do not add documentation under this bounty. It corrects and deletes: a doc drifts because it holds
more claims than the code can keep true, and adding more accelerates that. New docs come from a
human's request, not from a sweep.

## Findings log

- _(no runs yet)_

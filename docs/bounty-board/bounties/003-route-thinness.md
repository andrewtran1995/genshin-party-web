---
id: 003
title: Logic drifting out of $lib and into components
status: open
size: M
last-run: never
runs: 0
---

# Logic drifting out of `$lib` and into components

## Why this matters

`AGENTS.md` asks for thin route files with logic in `$lib`, and for flat component hierarchies. The
line has bent: `src/routes/char/+page.svelte` is 145 lines, and `CardChrome.svelte` is 450 — big
enough that the rules it encodes are only discoverable by reading it. Logic living in a `.svelte`
file is logic the node test project cannot reach, so it drags bounty 001 down with it: the only way
to test it is a browser test that renders the whole component.

## Scope

**In:** extracting pure logic out of `.svelte` files into `$lib` modules, splitting a component whose
responsibilities have visibly diverged, and deleting indirection that no longer earns its place.

**Out:** visual or behavioural change of any kind. A slice under this bounty should be provable by
its tests passing unchanged before and after.

## Exit criteria

- [ ] No file under `src/routes/` exceeds 100 lines.
- [ ] No component under `src/lib/components/` exceeds 250 lines.
- [ ] Every branch rule that decides _what_ is shown (as opposed to _how_) lives in a `$lib` module
      with a node-project test.

## Guardrails

Composition over abstraction, per `AGENTS.md`. Extracting a helper used once, or introducing a layer
whose only job is to forward props, makes the code worse and satisfies the line counts anyway —
these criteria are a symptom to chase, not a target to hit. If a slice cannot reduce a file without
adding an abstraction nobody asked for, log that in the findings and leave the file alone.

## Findings log

- _(no runs yet)_

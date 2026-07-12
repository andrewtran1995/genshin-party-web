# Genshin Party Web

A web counterpart to the `genshin-party` CLI that hosts random pickers for characters, bosses, selection order, and interactive party building.

## Language

**Build-time extraction**:
Trimming the `genshin-db` dataset into small, UI-shaped JSON files at build time so the runtime never loads the ~170 MB dependency.
_Avoid_: Runtime query, live data

**Client-side randomizer**:
Random selection logic that runs in the browser using the shipped dataset, producing a result without a server action.
_Avoid_: Server-side roll, form action roll

**Deterministic result page**:
A pre-rendered page whose content is fixed by a URL parameter, such as a chosen character or order permutation.
_Avoid_: Dynamic roll page, POST result

**URL-based state**:
Carrying the result of a random choice in the URL so the destination page can be pre-rendered and shared.
_Avoid_: Server session, form action state

**Player**:
A numbered participant in the interactive party flow, with an optional name.
_Avoid_: User, account

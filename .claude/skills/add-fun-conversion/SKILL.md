---
name: add-fun-conversion
description: Add a new fun-conversion entry to the Countdown component (the "That's X [unit]!" line beneath the clock). Handles timing constant, all three i18n locales, and test updates.
version: 1.0.0
user-invocable: true
argument-hint: "[unit label] [duration in ms or human-readable]"
---

Add a new fun-conversion unit to the countdown. A fun conversion is a single entry in
`FUN_CONVERSION_TIMINGS` that makes the countdown say "That's X [unit]!" with a duration
detail line ("N minutes each", etc.).

## Checklist

### 1 · Research the duration

Find a concrete, defensible number and a citable source URL. Follow the same pattern as
existing entries:

- Use the midpoint of a published range (e.g. "avg 10–20 min → use 15 min")
- Prefer peer-reviewed papers, official game/show pages, or aggregator sites with methodology
- Record the source URL — it goes directly in the code comment

### 2 · `src/lib/constants.ts`

Add the new entry to `FUN_CONVERSION_TIMINGS`. The array index **must** match the index in
all three `funConversions` translation arrays. Place it at the end (before Genshin) or
wherever it fits the narrative — but note that inserting mid-array forces a full test update.

```typescript
// [Short description]: [range/justification].
// Source: https://...
N * 1000, // human-readable note
```

### 3 · `src/lib/i18n/translations.ts` — all three locales

Add the label string at the **same index** in all three `funConversions` arrays:

| Locale | Approx line | Note |
|--------|-------------|------|
| `en`   | ~110        | Primary label; sets the pattern |
| `ko`   | ~262        | Korean — phonetic transliteration for foreign proper nouns |
| `vi`   | ~410        | Vietnamese — keep English proper nouns when no local name exists |

Missing one locale will cause the UI to show `undefined` for that language — there is no
compile-time guard on array length alignment.

### 4 · `src/lib/components/Countdown.svelte.test.ts`

Four things to update:

**a) Fixture array** (~line 12) — add the new label at the correct index:
```typescript
funConversions: [
    'laps around Rainbow Road',
    // ... existing entries ...
    'your new label',   // ← NEW at index N
    'Genshin Impact patches'
],
```

**b) Fun-text regex** (~line 68) — add the new label to the alternation:
```typescript
/^That's [\d,]+ (...|your new label|...)!$/
```

**c) Duration-detail regex** (~line 77) — add the expected `formatDuration` output if it
introduces a new display value. If the duration matches an existing entry (e.g. another
30-minute item), no change needed here:
```typescript
/^(~2 minutes|7 seconds|15 minutes|30 minutes|6 weeks) each$/
```

**d) Cycle test** (~line 90) — add one `fun.click(); await tick(); expect(...)` pair per new
entry, in index order. The cycle test mocks `Math.random` to 0, so `cycleFun()` advances
by exactly 1 each click.

### 5 · Verify

```bash
pnpm test:unit -- --run   # Countdown tests pass
pnpm check                # no svelte-check type errors
pnpm lint                 # prettier + eslint clean
```

---

## How `formatDuration` works (no guesswork needed)

`formatDuration(ms)` in `Countdown.svelte` picks the largest unit where `ms >= unit.ms`, then
rounds to the nearest 0.5 and marks as approximate if `|raw - rounded| > 1e-6`:

| Timing | Raw | Rounded | Approx | Display |
|--------|-----|---------|--------|---------|
| `7 * 1000` | 7 s | 7 | no | "7 seconds" |
| `130 * 1000` | 2.17 min | 2 | yes | "~2 minutes" |
| `15 * 60 * 1000` | 15 min | 15 | no | "15 minutes" |
| `30 * 60 * 1000` | 30 min | 30 | no | "30 minutes" |
| `42 * 24 * 60 * 60 * 1000` | 6 wk | 6 | no | "6 weeks" |

Just compute `ms / next-smaller-unit-ms` to predict what the test assertion should be.

---

## What to watch out for

**Order sensitivity in the cycle test.** The cycle test steps through indices 0, 1, 2, … in
order (with `Math.random` mocked to 0). Inserting an entry mid-array shifts every subsequent
index — update all assertions below the insertion point, not just the new one.

**Three locales, no compile-time alignment check.** `funConversions[N]` in each locale must
correspond to `FUN_CONVERSION_TIMINGS[N]`. TypeScript only checks that the array is
`string[]`, not that lengths match or indices align. Do all three locales in one commit.

**Equal-duration entries produce identical detail text.** Two 30-minute entries both show
"30 minutes each". The cycle test still passes, but add comments in the assertions so a
future reader knows which entry is being tested at each step.

**i18n for foreign proper nouns.** Korean and Vietnamese tend to keep English titles
phonetically transliterated or verbatim (see: TFT, Curb Your Enthusiasm, Rainbow Road).
Mark uncertain translations with a `// TODO: review ko/vi translation` comment if you're
not confident in the phonetic rendering.

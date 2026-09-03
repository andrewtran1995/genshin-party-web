/**
 * SPIKE — see ./README.md.
 *
 * `scripts/gen-data.ts` casts the Yatta response instead of checking it:
 *
 *   const json = (await response.json()) as {
 *     response: number;
 *     data: { items: Record<string, YattaMonster> };
 *   };
 *
 * That cast is load-bearing and unchecked. If Yatta renames `icon` or moves
 * `items`, the cast still succeeds, the id → icon map comes back empty or full
 * of `undefined`, and `gen-data.ts` quietly falls through to genshin-db's icon
 * filenames — a silent dataset regression rather than a failed build.
 *
 * Both implementations here close that hole; the question the ADR asks is what
 * closing it costs.
 */
export type DecodeResult =
	| { readonly ok: true; readonly icons: ReadonlyMap<number, string> }
	| { readonly ok: false; readonly error: string };

export type DecodeMonsterIcons = (payload: unknown) => DecodeResult;

import { shuffle } from 'remeda';
import type { Char, Element, Enemy, Rarity } from '$lib/types';
import charactersJson from './data/characters.json';
import bossesJson from './data/bosses.json';

// Build-time-extracted, trimmed dataset (see scripts/gen-data.ts). Static per
// `genshin-db` version, so it's loaded once as a module rather than queried.
// `Aether` and `Stormterror` are already excluded at extraction time.
const allChars = charactersJson as Char[];
const allBosses = bossesJson as Enemy[];

export interface GetCharsOptions {
	element?: Element | undefined;
	rarity?: Rarity | undefined;
}

/** Eligible characters for the given filters. Mirrors the CLI's `getChars`. */
export const getChars = ({ element, rarity }: GetCharsOptions = {}): Char[] =>
	allChars.filter(
		(char) =>
			(rarity === undefined || char.rarity === Number(rarity)) &&
			(element === undefined || char.element === element)
	);

/**
 * Eligible bosses. `weekly` restricts to weekly-boss-arena enemies; otherwise
 * any boss-type enemy. Mirrors the CLI's `boss` command filter.
 */
export const getBosses = ({ weekly }: { weekly: boolean }): Enemy[] =>
	allBosses.filter(
		weekly
			? (enemy) => enemy.categoryType === 'CODEX_SUBTYPE_BOSS'
			: (enemy) => enemy.enemyType === 'BOSS'
	);

/** Pick `count` distinct random items. Returns fewer if the pool is smaller. */
export const sample = <T>(items: readonly T[], count = 1): T[] => shuffle(items).slice(0, count);

/**
 * Infinitely yields random characters matching `filters`, exhausting the full
 * eligible set before any repeat. Mirrors the CLI's `randomChars`; callers
 * apply their own `onlyTeyvat`/`unique` filtering, as the CLI does.
 */
export function* randomChars(filters: GetCharsOptions = {}): Generator<Char> {
	for (;;) {
		const chars = getChars(filters);
		if (chars.length === 0) {
			return;
		}
		yield* shuffle(chars);
	}
}

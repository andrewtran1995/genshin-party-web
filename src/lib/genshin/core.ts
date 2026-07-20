import { shuffle } from 'remeda';
import type { Char, Element, Enemy, Rarity } from '$lib/types';
import charactersJson from './data/characters.json';
import bossesJson from './data/bosses.json';

// Build-time-extracted, trimmed dataset (see scripts/gen-data.ts). Static per
// `genshin-db` version, so it's loaded once as a module rather than queried.
// `Aether` and `Stormterror` are already excluded at extraction time.
const allChars = charactersJson as Char[];
const allBosses = bossesJson as Enemy[];

/** Characters not from Teyvat — excluded by `/interactive` by default (matches
 * the CLI's `--only-teyvat`). Kept at the call site, not in the data layer. */
export const NON_TEYVAT = ['Aloy', 'Lumine'] as const;

export const PARTY_SIZE = 4;
export const GAUNTLET_SIZE = 3;

export interface GetCharsOptions {
	element?: Element | undefined;
	rarity?: Rarity | undefined;
	/** When false, exclude Aloy and Lumine (Traveler). Default true. */
	includeTraveler?: boolean | undefined;
	/** Names to exclude from the result (e.g. already chosen characters). */
	exclude?: readonly string[] | undefined;
}

/** Eligible characters for the given filters. Mirrors the CLI's `getChars`. */
export const getChars = ({
	element,
	rarity,
	includeTraveler = true,
	exclude
}: GetCharsOptions = {}): Char[] =>
	allChars.filter(
		(char) =>
			(rarity === undefined || char.rarity === Number(rarity)) &&
			(element === undefined || char.element === element) &&
			(includeTraveler || !(NON_TEYVAT as readonly string[]).includes(char.name)) &&
			!exclude?.includes(char.name)
	);

/** Look up a character by name. */
export const getCharByName = (name: string): Char | undefined =>
	allChars.find((char) => char.name === name);

/** All character names, useful for pre-rendering entry lists. */
export const getAllCharNames = (): string[] => allChars.map((char) => char.name);

export interface GetBossesOptions {
	/** When true, restrict to weekly-boss-arena enemies. Default false. */
	weekly?: boolean | undefined;
	/** Names to exclude from the result (e.g. already chosen bosses). */
	exclude?: readonly string[] | undefined;
}

const WEEKLY_CODEX_TYPE = 'CODEX_SUBTYPE_BOSS';

/** Whether an enemy is a weekly-boss-arena enemy. */
export const isWeeklyBoss = (enemy: Enemy): boolean => enemy.categoryType === WEEKLY_CODEX_TYPE;

/** Eligible bosses. Mirrors the CLI's `boss` command filter. */
export const getBosses = ({ weekly = false, exclude }: GetBossesOptions = {}): Enemy[] =>
	allBosses.filter(
		weekly
			? (enemy) => isWeeklyBoss(enemy) && !exclude?.includes(enemy.name)
			: (enemy) => enemy.enemyType === 'BOSS' && !exclude?.includes(enemy.name)
	);

/** Look up a boss by name. */
export const getBossByName = (name: string): Enemy | undefined =>
	allBosses.find((enemy) => enemy.name === name);

/** All boss names, useful for pre-rendering entry lists. */
export const getAllBossNames = (): string[] => allBosses.map((boss) => boss.name);

/** Pick `count` distinct random items. Returns fewer if the pool is smaller. */
export const sample = <T>(items: readonly T[], count = 1): T[] => shuffle(items).slice(0, count);

/** Return one random eligible character, or `undefined` if the pool is empty. */
export const getRandomChar = (options: GetCharsOptions = {}): Char | undefined => {
	const [char] = sample(getChars(options));
	return char;
};

/** Return one random eligible boss, or `undefined` if the pool is empty. */
export const getRandomBoss = (options: GetBossesOptions = {}): Enemy | undefined => {
	const [boss] = sample(getBosses(options));
	return boss;
};

/** Return `count` distinct random bosses, or fewer if the pool is smaller. */
export const getRandomBosses = (options: GetBossesOptions = {}, count = 1): Enemy[] =>
	sample(getBosses(options), count);

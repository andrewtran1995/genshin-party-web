import type { Enemy } from '$lib/types';
import { rollCardVariant, serializeCardVariantList } from '$lib/card-variant';
import bossesJson from './data/bosses.json';
import { sample } from './sample';
import { encodePathSegment } from './path-segment';

// Build-time-extracted, trimmed dataset (see scripts/gen-data.ts). Static per
// `genshin-db` version, so it's loaded once as a module rather than queried.
// `Stormterror` is already excluded at extraction time.
const allBosses = bossesJson as Enemy[];

export const GAUNTLET_SIZE = 3;

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

/** Return one random eligible boss, or `undefined` if the pool is empty. */
export const getRandomBoss = (options: GetBossesOptions = {}): Enemy | undefined => {
	const [boss] = sample(getBosses(options));
	return boss;
};

/** Return `count` distinct random bosses, or fewer if the pool is smaller. */
export const getRandomBosses = (options: GetBossesOptions = {}, count = 1): Enemy[] =>
	sample(getBosses(options), count);

export const BOSS_ERROR = 'No bosses match those filters.';

export const parseBossFilters = (
	input: URLSearchParams | FormData
): { weekly: boolean; gauntlet?: boolean } => {
	const weekly = input.get('weekly') !== null;
	if (input instanceof FormData) {
		const gauntlet = input.has('gauntlet');
		return { weekly, gauntlet };
	}
	return { weekly };
};

export const serializeBossFilters = ({ weekly }: { weekly?: boolean }): string => {
	const params = new URLSearchParams();
	if (weekly) params.set('weekly', '1');
	return params.toString();
};

export const rollBossUrl = ({
	gauntlet = false,
	weekly = false,
	exclude
}: {
	gauntlet?: boolean | undefined;
	weekly?: boolean | undefined;
	exclude?: readonly string[] | undefined;
} = {}): string | undefined => {
	const params = new URLSearchParams(serializeBossFilters({ weekly }));
	if (gauntlet) {
		const bosses = getRandomBosses({ weekly, exclude }, GAUNTLET_SIZE);
		if (bosses.length === 0) return undefined;
		params.set('variant', serializeCardVariantList(bosses.map(() => rollCardVariant())));
		const path = `/boss/${bosses.map((boss) => encodePathSegment(boss.name)).join('/')}`;
		return `${path}?${params.toString()}`;
	}
	const boss = getRandomBoss({ weekly, exclude });
	if (!boss) return undefined;
	params.set('variant', rollCardVariant());
	const path = `/boss/${encodePathSegment(boss.name)}`;
	return `${path}?${params.toString()}`;
};

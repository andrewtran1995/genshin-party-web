import {
	GAUNTLET_SIZE,
	PARTY_SIZE,
	getRandomBoss,
	getRandomBosses,
	getRandomChar,
	sample
} from './core';
import type { GetCharsOptions } from './core';
import { isElement, isRarity } from '$lib/types';

export const CHAR_ERROR = 'No character matches those filters.';
export const BOSS_ERROR = 'No bosses match those filters.';

type FilterInput = URLSearchParams | FormData;

const getInputValue = (input: FilterInput, key: string): string => {
	const value = input.get(key);
	return typeof value === 'string' ? value : '';
};

export const parseCharFilters = (
	input: FilterInput
): Pick<GetCharsOptions, 'element' | 'rarity'> => {
	const rawElement = getInputValue(input, 'element');
	const rawRarity = getInputValue(input, 'rarity');
	const element = rawElement && isElement(rawElement) ? rawElement : undefined;
	const rarity = rawRarity && isRarity(rawRarity) ? rawRarity : undefined;
	return { element, rarity };
};

export const serializeCharFilters = ({
	element,
	rarity
}: Pick<GetCharsOptions, 'element' | 'rarity'>): string => {
	const params = new URLSearchParams();
	if (element) params.set('element', element);
	if (rarity) params.set('rarity', rarity);
	return params.toString();
};

export const parseBossFilters = (input: FilterInput): { weekly: boolean; gauntlet?: boolean } => {
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

export const rollCharUrl = (filters: GetCharsOptions): string | undefined => {
	const char = getRandomChar(filters);
	if (!char) return undefined;
	const query = serializeCharFilters(filters);
	const path = `/char/${encodeURIComponent(char.name)}`;
	return query ? `${path}?${query}` : path;
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
	const query = serializeBossFilters({ weekly });
	if (gauntlet) {
		const bosses = getRandomBosses({ weekly, exclude }, GAUNTLET_SIZE);
		if (bosses.length === 0) return undefined;
		const path = `/boss/${bosses.map((boss) => encodeURIComponent(boss.name)).join('/')}`;
		return query ? `${path}?${query}` : path;
	}
	const boss = getRandomBoss({ weekly, exclude });
	if (!boss) return undefined;
	const path = `/boss/${encodeURIComponent(boss.name)}`;
	return query ? `${path}?${query}` : path;
};

export const permutations = (arr: number[]): number[][] => {
	if (arr.length <= 1) return [arr];
	const result: number[][] = [];
	for (let i = 0; i < arr.length; i++) {
		const first = arr[i];
		if (first === undefined) continue;
		const rest = arr.slice(0, i).concat(arr.slice(i + 1));
		for (const p of permutations(rest)) {
			result.push([first, ...p]);
		}
	}
	return result;
};

export const allPermutations = (): number[][] =>
	permutations(Array.from({ length: PARTY_SIZE }, (_, i) => i + 1));

export const isValidPermutation = (value: string): boolean => {
	const numbers = value.split(',').map((n) => Number(n.trim()));
	if (numbers.length !== PARTY_SIZE) return false;
	if (numbers.some((n) => !Number.isInteger(n) || n < 1 || n > PARTY_SIZE)) return false;
	return new Set(numbers).size === PARTY_SIZE;
};

export const rollOrderUrl = ({ exclude }: { exclude?: string } = {}): string => {
	const all = allPermutations();
	const pool = exclude ? all.filter((p) => p.join(',') !== exclude) : all;
	const order = pool.length > 0 ? sample(pool, 1)[0] : sample(all, 1)[0];
	if (order === undefined) {
		// Defensive: PARTY_SIZE is fixed at 4, so this cannot happen, but the type
		// system does not know all is non-empty.
		return `/order/${all[0]?.join(',') ?? '1,2,3,4'}`;
	}
	return `/order/${order.join(',')}`;
};

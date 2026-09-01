import { sample } from './sample';

export const PARTY_SIZE = 4;

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

import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

const PLAYERS = [1, 2, 3, 4];

function permutations(arr: number[]): number[][] {
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
}

export const prerender = true;

export const entries = () =>
	permutations(PLAYERS).map((order) => ({ permutation: order.join(',') }));

export const load: PageLoad = ({ params }) => {
	const numbers = params.permutation.split(',').map((n) => Number(n.trim()));
	if (
		numbers.length !== PLAYERS.length ||
		numbers.some((n) => !Number.isInteger(n) || n < 1 || n > PLAYERS.length) ||
		new Set(numbers).size !== PLAYERS.length
	) {
		error(404, 'Invalid order');
	}
	return { order: numbers };
};

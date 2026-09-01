import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { allPermutations, isValidPermutation } from '$lib/genshin/order';

export const prerender = true;

export const entries = () => allPermutations().map((order) => ({ permutation: order.join(',') }));

export const load: PageLoad = ({ params }) => {
	if (!isValidPermutation(params.permutation)) {
		error(404, 'Invalid order');
	}
	const numbers = params.permutation.split(',').map((n) => Number(n.trim()));
	return { order: numbers };
};

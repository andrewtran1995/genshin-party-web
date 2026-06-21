import type { Actions } from './$types';
import { shuffled } from '$lib/random';

export const actions = {
	default: () => {
		const order = shuffled([1, 2, 3, 4]);
		return { order };
	}
} satisfies Actions;

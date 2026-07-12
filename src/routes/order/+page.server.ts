import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { sample } from '$lib/genshin';

export const actions = {
	default: () => {
		const order = sample([1, 2, 3, 4], 4).join(',');
		redirect(303, `/order/${order}`);
	}
} satisfies Actions;

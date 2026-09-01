import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { rollOrderUrl } from '$lib/genshin/order';

export const actions = {
	default: () => {
		redirect(303, rollOrderUrl());
	}
} satisfies Actions;

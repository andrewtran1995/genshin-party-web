import { redirect } from '@sveltejs/kit';
import { form } from '$app/server';
import { rollOrderUrl } from '$lib/genshin/order';

export const rollOrder = form(() => {
	redirect(303, rollOrderUrl());
});

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { elements, rarities } from '$lib/types';
import { CHAR_ERROR, rollCharUrl, parseCharFilters } from '$lib/genshin';

export const load: PageServerLoad = () => {
	return { elements, rarities };
};

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const url = rollCharUrl(parseCharFilters(data));
		if (!url) {
			return fail(404, { error: CHAR_ERROR });
		}
		redirect(303, url);
	}
} satisfies Actions;

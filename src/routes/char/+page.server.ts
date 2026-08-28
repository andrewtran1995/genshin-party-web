import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { elements, rarities } from '$lib/types';
import {
	CHAR_ERROR,
	encodePathSegment,
	getCharByName,
	getChars,
	parseCharFilters,
	rollCharUrl
} from '$lib/genshin';
import { cardVariants, parseVariantOverride } from '$lib/card-variant';

export const load: PageServerLoad = () => {
	const characters = getChars()
		.map((char) => ({ name: char.name, element: char.element, rarity: char.rarity }))
		.sort((a, b) => a.name.localeCompare(b.name));
	return { elements, rarities, cardVariants, characters };
};

export const actions = {
	roll: async ({ request }) => {
		const data = await request.formData();
		const url = rollCharUrl(parseCharFilters(data), parseVariantOverride(data.get('variant')));
		if (!url) {
			return fail(404, { error: CHAR_ERROR });
		}
		redirect(303, url);
	},
	debug: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('character');
		if (typeof name !== 'string' || !getCharByName(name)) {
			return fail(400, { debugError: 'Select a valid character.' });
		}
		redirect(303, `/char/${encodePathSegment(name)}?allVariants=1`);
	}
} satisfies Actions;

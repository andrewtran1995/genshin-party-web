import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { elements, isElement, isRarity, rarities } from '$lib/types';
import { getChars, sample } from '$lib/server/genshin';

export const load: PageServerLoad = () => {
	return { elements, rarities };
};

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		const elementRaw = data.get('element');
		const rarityRaw = data.get('rarity');
		const element = typeof elementRaw === 'string' && elementRaw ? elementRaw : undefined;
		const rarity = typeof rarityRaw === 'string' && rarityRaw ? rarityRaw : undefined;

		if (element !== undefined && !isElement(element)) {
			return fail(400, { error: 'Unknown element.' });
		}
		if (rarity !== undefined && !isRarity(rarity)) {
			return fail(400, { error: 'Unknown rarity.' });
		}

		const [char] = sample(getChars({ element, rarity }));
		if (!char) {
			return fail(404, { error: 'No character matches those filters.' });
		}

		return { char };
	}
} satisfies Actions;

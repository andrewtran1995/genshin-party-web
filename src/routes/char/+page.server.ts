import type { Actions, PageServerLoad } from './$types';
import { getChars } from '$lib/server/genshin-db';
import { pickRandom } from '$lib/random';
import { elements, rarities, type Element, type Rarity } from '$lib/types';
import { fail } from '@sveltejs/kit';

function parseElement(value: FormDataEntryValue | null): Element | undefined {
	if (typeof value !== 'string' || value === '') return undefined;
	return (elements as readonly string[]).includes(value) ? (value as Element) : undefined;
}

function parseRarity(value: FormDataEntryValue | null): Rarity | undefined {
	if (typeof value !== 'string' || value === '') return undefined;
	return (rarities as readonly string[]).includes(value) ? (value as Rarity) : undefined;
}

export const load: PageServerLoad = () => {
	return {
		elements,
		rarities
	};
};

export const actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const element = parseElement(form.get('element'));
		const rarity = parseRarity(form.get('rarity'));

		const candidates = await getChars({ element, rarity });
		const pick = pickRandom(candidates);
		if (!pick) {
			return fail(400, { error: 'No character matches that filter.' });
		}
		return { pick, filters: { element: element ?? null, rarity: rarity ?? null } };
	}
} satisfies Actions;

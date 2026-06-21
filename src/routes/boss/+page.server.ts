import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { getBosses, sample } from '$lib/server/genshin';

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const gauntlet = data.has('gauntlet');
		const weekly = data.has('weekly');

		const bosses = sample(getBosses({ weekly }), gauntlet ? 3 : 1);
		if (bosses.length === 0) {
			return fail(404, { error: 'No bosses match those filters.' });
		}

		return { bosses };
	}
} satisfies Actions;

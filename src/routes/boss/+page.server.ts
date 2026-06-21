import type { Actions } from './$types';
import { getBosses } from '$lib/server/genshin-db';
import { pickRandomN } from '$lib/random';
import { fail } from '@sveltejs/kit';

export const actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const gauntlet = form.get('gauntlet') === 'on';
		const weekly = form.get('weekly') !== 'off';

		const bosses = await getBosses({ weekly });
		const picks = pickRandomN(bosses, gauntlet ? 3 : 1);
		if (picks.length === 0) {
			return fail(400, { error: 'No bosses available.' });
		}
		return { picks, gauntlet, weekly };
	}
} satisfies Actions;

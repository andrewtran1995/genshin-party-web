import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { getRandomBoss, getRandomBosses } from '$lib/genshin';

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const gauntlet = data.has('gauntlet');
		const weekly = data.has('weekly');

		if (gauntlet) {
			const bosses = getRandomBosses({ weekly }, 3);
			if (bosses.length === 0) {
				return fail(404, { error: 'No bosses match those filters.' });
			}
			const names = bosses.map((boss) => boss.name);
			const params = new URLSearchParams();
			if (weekly) params.set('weekly', '1');
			const query = params.toString();
			redirect(303, `/boss/${names.map(encodeURIComponent).join('/')}${query ? `?${query}` : ''}`);
		} else {
			const boss = getRandomBoss({ weekly });
			if (!boss) {
				return fail(404, { error: 'No bosses match those filters.' });
			}
			const params = new URLSearchParams();
			if (weekly) params.set('weekly', '1');
			const query = params.toString();
			redirect(303, `/boss/${encodeURIComponent(boss.name)}${query ? `?${query}` : ''}`);
		}
	}
} satisfies Actions;

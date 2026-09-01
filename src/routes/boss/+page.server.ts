import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { BOSS_ERROR, rollBossUrl, parseBossFilters } from '$lib/genshin/bosses';

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const { gauntlet, weekly } = parseBossFilters(data);
		const url = rollBossUrl({ gauntlet, weekly });
		if (!url) {
			return fail(404, { error: BOSS_ERROR });
		}
		redirect(303, url);
	}
} satisfies Actions;

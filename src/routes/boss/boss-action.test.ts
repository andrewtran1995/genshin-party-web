import { describe, expect, it, vi } from 'vitest';
import { fail } from '@sveltejs/kit';

// The real form can never reach the action's fail() branch: with the current
// dataset (13 weekly bosses, GAUNTLET_SIZE 3) every filter combination a user
// can submit resolves to a real boss. rollBossUrl only returns undefined when
// the pool is exhausted via `exclude`, which the action never passes. Mock it
// to force that branch and exercise the action directly, bypassing both the
// browser and the client-side roll path.
vi.mock('$lib/genshin/bosses', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/genshin/bosses')>();
	return { ...actual, rollBossUrl: vi.fn(() => undefined) };
});

import { actions } from './+page.server';
import { BOSS_ERROR } from '$lib/genshin/bosses';

describe('boss action', () => {
	it('returns fail(404) with BOSS_ERROR when rollBossUrl finds no match', async () => {
		const formData = new FormData();
		formData.set('gauntlet', 'on');
		formData.set('weekly', 'on');
		const event = { request: { formData: () => Promise.resolve(formData) } } as Parameters<
			typeof actions.default
		>[0];

		const result = await actions.default(event);

		expect(result).toEqual(fail(404, { error: BOSS_ERROR }));
	});
});

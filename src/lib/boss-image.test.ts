import { describe, expect, it } from 'vitest';
import { getBossImageUrl } from './boss-image';
import type { Enemy } from './types';

const baseBoss: Enemy = {
	name: 'Test Boss',
	description: 'A test boss.',
	categoryType: 'CODEX_SUBTYPE_BOSS',
	enemyType: 'BOSS',
	icon: 'https://icon.test'
};

describe('getBossImageUrl', () => {
	it('returns the icon URL when available', () => {
		expect(getBossImageUrl(baseBoss)).toBe('https://icon.test');
	});

	it('returns undefined when no icon is available', () => {
		const boss: Enemy = { ...baseBoss, icon: undefined };
		expect(getBossImageUrl(boss)).toBeUndefined();
	});
});

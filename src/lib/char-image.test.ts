import { describe, expect, it } from 'vitest';
import { getCharImageUrl } from './char-image';
import type { Char } from './types';

const baseChar: Char = {
	id: 1,
	name: 'Test',
	title: '',
	rarity: 5,
	element: 'pyro',
	elementText: 'Pyro',
	weaponText: 'Sword',
	region: 'Mondstadt',
	portrait: null,
	icon: 'https://icon.test',
	fandomUrl: null
};

describe('getCharImageUrl', () => {
	it('prefers portrait over icon', () => {
		const char: Char = { ...baseChar, portrait: 'https://portrait.test' };
		expect(getCharImageUrl(char)).toBe('https://portrait.test');
	});

	it('falls back to icon when portrait is missing', () => {
		const char: Char = { ...baseChar, portrait: null };
		expect(getCharImageUrl(char)).toBe('https://icon.test');
	});

	it('returns null when no image is available', () => {
		const char: Char = { ...baseChar, portrait: null, icon: null };
		expect(getCharImageUrl(char)).toBeNull();
	});
});

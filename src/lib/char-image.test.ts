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
	portrait: undefined,
	icon: 'https://icon.test',
	fandomUrl: undefined
};

describe('getCharImageUrl', () => {
	it('prefers portrait over icon', () => {
		const char: Char = { ...baseChar, portrait: 'https://portrait.test' };
		expect(getCharImageUrl(char)).toBe('https://portrait.test');
	});

	it('falls back to icon when portrait is missing', () => {
		const char: Char = { ...baseChar, portrait: undefined };
		expect(getCharImageUrl(char)).toBe('https://icon.test');
	});

	it('returns undefined when no image is available', () => {
		const char: Char = { ...baseChar, portrait: undefined, icon: undefined };
		expect(getCharImageUrl(char)).toBeUndefined();
	});
});

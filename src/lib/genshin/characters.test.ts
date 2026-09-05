import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { it as itProp } from '@fast-check/vitest';
import {
	charFilterLabels,
	charMismatchesFilters,
	getAllCharNames,
	getCharByName,
	getChars,
	getRandomChar,
	parseCharFilters,
	rollCharUrl,
	serializeCharFilters
} from './characters';
import { cardVariants } from '$lib/card-variant';

describe('getChars', () => {
	it('excludes Aether so the Traveler is not returned twice', () => {
		expect(getChars().some((char) => char.name === 'Aether')).toBe(false);
	});

	it('keeps Lumine and Aloy by default (only `/interactive` excludes them)', () => {
		const names = getChars().map((char) => char.name);
		expect(names).toContain('Lumine');
		expect(names).toContain('Aloy');
	});

	it('filters by rarity', () => {
		const chars = getChars({ rarity: '5' });
		expect(chars.length).toBeGreaterThan(0);
		expect(chars.every((char) => char.rarity === 5)).toBe(true);
	});

	it('filters by element', () => {
		const chars = getChars({ element: 'pyro' });
		expect(chars.length).toBeGreaterThan(0);
		expect(chars.every((char) => char.element === 'pyro')).toBe(true);
	});

	it('excludes Aloy and Lumine when includeTraveler is false', () => {
		const chars = getChars({ includeTraveler: false });
		expect(chars.every((char) => char.name !== 'Aloy' && char.name !== 'Lumine')).toBe(true);
	});

	it('excludes characters by name when requested', () => {
		const allNames = getChars().map((char) => char.name);
		const excluded = allNames.slice(0, 5);
		const chars = getChars({ exclude: excluded });
		expect(chars.some((char) => excluded.includes(char.name))).toBe(false);
	});
});

describe('getCharByName', () => {
	it('returns the matching character', () => {
		expect(getCharByName('Aloy')?.name).toBe('Aloy');
	});

	it('returns undefined for unknown names', () => {
		expect(getCharByName('Unknown')).toBeUndefined();
	});
});

describe('getRandomChar', () => {
	it('returns a character from the eligible pool', () => {
		const char = getRandomChar({ rarity: '5' });
		expect(char).toBeDefined();
		expect(char?.rarity).toBe(5);
	});

	it('returns undefined when the pool is empty', () => {
		const allNames = getChars().map((char) => char.name);
		expect(getRandomChar({ exclude: allNames })).toBeUndefined();
	});
});

describe('parseCharFilters', () => {
	itProp.prop([
		fc.record({
			element: fc.oneof(
				fc.constant(undefined),
				fc.constantFrom(...getValidElements()),
				fc.constantFrom('invalid', 'void', '')
			),
			rarity: fc.oneof(fc.constant(undefined), fc.constantFrom('4', '5'), fc.constantFrom('7', ''))
		})
	])('never throws and drops invalid values', ({ element, rarity }) => {
		const params = new URLSearchParams();
		if (element !== undefined) params.set('element', element);
		if (rarity !== undefined) params.set('rarity', rarity);
		const result = parseCharFilters(params);
		if (result.element !== undefined) expect(getValidElements()).toContain(result.element);
		if (result.rarity !== undefined) expect(['4', '5']).toContain(result.rarity);
	});

	it('parses a known element and rarity', () => {
		const params = new URLSearchParams('element=pyro&rarity=5');
		expect(parseCharFilters(params)).toEqual({ element: 'pyro', rarity: '5' });
	});

	it('drops unknown element and rarity', () => {
		const params = new URLSearchParams('element=void&rarity=7');
		expect(parseCharFilters(params)).toEqual({ element: undefined, rarity: undefined });
	});
});

describe('serializeCharFilters', () => {
	it('round-trips with parseCharFilters', () => {
		const original = { element: 'hydro' as const, rarity: '5' as const };
		const query = serializeCharFilters(original);
		expect(parseCharFilters(new URLSearchParams(query))).toEqual(original);
	});

	it('returns empty string when no filters', () => {
		expect(serializeCharFilters({})).toBe('');
	});
});

describe('rollCharUrl', () => {
	itProp.prop([fc.constantFrom(...getValidElements()), fc.constantFrom('4', '5', undefined)])(
		'always returns a valid character URL for non-empty pools',
		(element, rarity) => {
			fc.pre(getChars({ element, rarity }).length > 0);
			const url = rollCharUrl({ element, rarity });
			expect(url).toBeDefined();
			expect(url).toMatch(/^\/char\//);
			if (!url) throw new Error('expected a url');

			const name = decodeURIComponent(url.replace('/char/', '').split('?')[0] ?? '');
			expect(getAllCharNames()).toContain(name);

			const char = getChars().find((c) => c.name === name);
			expect(char).toBeDefined();
			if (!char) throw new Error('expected a char');
			expect(char.element).toBe(element);
			if (rarity) expect(char.rarity).toBe(Number(rarity));
		}
	);

	it('returns undefined for an empty pool', () => {
		expect(rollCharUrl({ exclude: getAllCharNames() })).toBeUndefined();
	});

	it('never returns an excluded character', () => {
		const [excluded] = getAllCharNames();
		if (excluded === undefined) throw new Error('expected at least one character');
		for (let i = 0; i < 50; i++) {
			const url = rollCharUrl({ exclude: [excluded] });
			expect(url).toBeDefined();
			expect(url).not.toContain(encodeURIComponent(excluded));
		}
	});

	it('includes a valid variant query param', () => {
		const url = rollCharUrl({});
		expect(url).toBeDefined();
		if (!url) throw new Error('expected a url');
		const variant = new URLSearchParams(url.split('?')[1]).get('variant');
		expect(cardVariants).toContain(variant);
	});

	it('does not mark the variant as forced when none is requested', () => {
		const url = rollCharUrl({});
		expect(url).toBeDefined();
		if (!url) throw new Error('expected a url');
		expect(new URLSearchParams(url.split('?')[1]).get('forceVariant')).toBeNull();
	});

	it('uses the requested variant instead of rolling one, and marks it forced', () => {
		for (const variant of cardVariants) {
			const url = rollCharUrl({}, variant);
			expect(url).toBeDefined();
			if (!url) throw new Error('expected a url');
			const params = new URLSearchParams(url.split('?')[1]);
			expect(params.get('variant')).toBe(variant);
			expect(params.get('forceVariant')).toBe('1');
		}
	});
});

describe('charFilterLabels', () => {
	it('returns no labels when nothing was filtered', () => {
		expect(charFilterLabels({})).toEqual([]);
	});

	it('capitalizes the element', () => {
		expect(charFilterLabels({ element: 'pyro' })).toEqual(['Pyro']);
	});

	it('stars the rarity', () => {
		expect(charFilterLabels({ rarity: '5' })).toEqual(['5★']);
	});

	it('labels a forced variant', () => {
		expect(charFilterLabels({ forcedVariant: 'holo' })).toEqual(['Holo']);
	});

	it('combines all three in element, rarity, variant order', () => {
		expect(
			charFilterLabels({ element: 'hydro', rarity: '4', forcedVariant: 'reverse-holo' })
		).toEqual(['Hydro', '4★', 'Reverse Holo']);
	});
});

describe('charMismatchesFilters', () => {
	const char = { element: 'pyro', rarity: 5 } as const;

	it('matches when no filters are set', () => {
		expect(charMismatchesFilters(char, {})).toBe(false);
	});

	it('matches when the char satisfies the filters', () => {
		expect(charMismatchesFilters(char, { element: 'pyro', rarity: '5' })).toBe(false);
	});

	it('flags a mismatched element', () => {
		expect(charMismatchesFilters(char, { element: 'hydro' })).toBe(true);
	});

	it('flags a mismatched rarity', () => {
		expect(charMismatchesFilters(char, { rarity: '4' })).toBe(true);
	});
});

function getValidElements() {
	return ['anemo', 'cryo', 'dendro', 'electro', 'geo', 'hydro', 'pyro', 'none'] as const;
}

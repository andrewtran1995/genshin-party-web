import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { it as itProp } from '@fast-check/vitest';
import {
	rollCharUrl,
	rollBossUrl,
	rollOrderUrl,
	parseCharFilters,
	serializeCharFilters,
	parseBossFilters,
	serializeBossFilters,
	isValidPermutation,
	allPermutations
} from './rolls';
import { getAllBossNames, getAllCharNames, getBosses, getChars } from './core';

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

describe('parseBossFilters', () => {
	it('detects weekly from the query string', () => {
		expect(parseBossFilters(new URLSearchParams('weekly=1'))).toEqual({ weekly: true });
		expect(parseBossFilters(new URLSearchParams(''))).toEqual({ weekly: false });
	});

	it('detects gauntlet from form data', () => {
		const form = new FormData();
		form.append('gauntlet', 'on');
		form.append('weekly', '1');
		expect(parseBossFilters(form)).toEqual({ weekly: true, gauntlet: true });
	});
});

describe('serializeBossFilters', () => {
	it('returns empty string when not weekly', () => {
		expect(serializeBossFilters({ weekly: false })).toBe('');
	});

	it('round-trips with parseBossFilters', () => {
		const query = serializeBossFilters({ weekly: true });
		expect(parseBossFilters(new URLSearchParams(query))).toEqual({ weekly: true });
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
});

describe('rollBossUrl', () => {
	it('returns a single-boss URL with the weekly flag preserved', () => {
		const url = rollBossUrl({ weekly: true });
		expect(url).toBeDefined();
		expect(url).toMatch(/^\/boss\//);
		expect(url).toContain('?weekly=1');
		if (!url) throw new Error('expected a url');

		const name = decodeURIComponent(url.replace('/boss/', '').split('?')[0] ?? '');
		expect(getAllBossNames()).toContain(name);
		expect(getBosses({ weekly: true }).some((boss) => boss.name === name)).toBe(true);
	});

	it('returns a gauntlet URL with three distinct bosses', () => {
		const url = rollBossUrl({ gauntlet: true, weekly: false });
		expect(url).toBeDefined();
		if (!url) throw new Error('expected a url');
		const path = (url.split('?')[0] ?? '').replace('/boss/', '');
		const names = path.split('/').map(decodeURIComponent);
		expect(names).toHaveLength(3);
		expect(new Set(names).size).toBe(3);
		expect(names.every((name) => getAllBossNames().includes(name))).toBe(true);
	});

	it('excludes bosses when rerolling', () => {
		const names = getAllBossNames();
		const [first] = names;
		if (first === undefined) throw new Error('expected at least one boss');
		for (let i = 0; i < 50; i++) {
			const url = rollBossUrl({ exclude: [first] });
			expect(url).toBeDefined();
			if (!url) throw new Error('expected a url');
			expect(decodeURIComponent(url.replace('/boss/', '').split('?')[0] ?? '')).not.toBe(first);
		}
	});
});

describe('rollOrderUrl', () => {
	it('returns a valid permutation', () => {
		const url = rollOrderUrl();
		expect(url).toMatch(/^\/order\/[1-4](,[1-4]){3}$/);
		const permutation = url.replace('/order/', '');
		expect(isValidPermutation(permutation)).toBe(true);
	});

	it('excludes the current permutation when rerolling', () => {
		const current = '1,2,3,4';
		for (let i = 0; i < 50; i++) {
			const url = rollOrderUrl({ exclude: current });
			expect(url).not.toBe(`/order/${current}`);
		}
	});
});

describe('isValidPermutation', () => {
	it('accepts every valid permutation', () => {
		for (const order of allPermutations()) {
			expect(isValidPermutation(order.join(','))).toBe(true);
		}
	});

	it('rejects invalid permutations', () => {
		expect(isValidPermutation('1,2,3')).toBe(false);
		expect(isValidPermutation('1,2,3,3')).toBe(false);
		expect(isValidPermutation('1,2,3,5')).toBe(false);
		expect(isValidPermutation('1,2,3,a')).toBe(false);
	});
});

function getValidElements() {
	return ['anemo', 'cryo', 'dendro', 'electro', 'geo', 'hydro', 'pyro', 'none'] as const;
}

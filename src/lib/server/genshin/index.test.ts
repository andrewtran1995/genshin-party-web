import { describe, expect, it } from 'vitest';
import type { Char } from '$lib/types';
import { getBosses, getChars, randomChars, sample } from './index';

describe('getChars', () => {
	it('excludes Aether so the Traveler is not returned twice', () => {
		expect(getChars().some((char) => char.name === 'Aether')).toBe(false);
	});

	it('keeps Lumine and Aloy (only `/interactive` excludes them)', () => {
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
});

describe('getBosses', () => {
	it('excludes Stormterror', () => {
		expect(getBosses({ weekly: true }).some((boss) => boss.name === 'Stormterror')).toBe(false);
		expect(getBosses({ weekly: false }).some((boss) => boss.name === 'Stormterror')).toBe(false);
	});

	it('restricts to weekly-boss-arena enemies when weekly', () => {
		const bosses = getBosses({ weekly: true });
		expect(bosses.length).toBeGreaterThan(0);
		expect(bosses.every((boss) => boss.categoryType === 'CODEX_SUBTYPE_BOSS')).toBe(true);
	});

	it('returns any boss-type enemy when not weekly', () => {
		const bosses = getBosses({ weekly: false });
		expect(bosses.length).toBeGreaterThan(0);
		expect(bosses.every((boss) => boss.enemyType === 'BOSS')).toBe(true);
	});
});

describe('sample', () => {
	it('returns the requested count of distinct items', () => {
		const picked = sample([1, 2, 3, 4, 5], 3);
		expect(picked).toHaveLength(3);
		expect(new Set(picked).size).toBe(3);
	});

	it('caps at the pool size', () => {
		expect(sample([1, 2], 5)).toHaveLength(2);
	});
});

describe('randomChars', () => {
	it('exhausts the full eligible set before repeating', () => {
		const eligible = getChars({ rarity: '5' });

		const firstCycle: Char[] = [];
		for (const char of randomChars({ rarity: '5' })) {
			firstCycle.push(char);
			if (firstCycle.length === eligible.length) break;
		}

		expect(new Set(firstCycle.map((char) => char.name)).size).toBe(eligible.length);
		expect(new Set(firstCycle)).toEqual(new Set(eligible));
	});
});

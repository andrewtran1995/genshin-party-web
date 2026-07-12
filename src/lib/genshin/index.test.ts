import { describe, expect, it } from 'vitest';
import type { Char } from '$lib/types';
import {
	getBossByName,
	getBosses,
	getCharByName,
	getChars,
	getElementIconUrl,
	getRandomBosses,
	getRandomChar,
	randomChars,
	sample
} from './index';

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

describe('getElementIconUrl', () => {
	it('returns the official icon URL for each real element', () => {
		for (const element of ['anemo', 'cryo', 'dendro', 'electro', 'geo', 'hydro', 'pyro'] as const) {
			const url = getElementIconUrl(element);
			expect(url).toBeTruthy();
			expect(url).toContain(`Element_${element.charAt(0).toUpperCase() + element.slice(1)}`);
		}
	});

	it('returns undefined for the none element', () => {
		expect(getElementIconUrl('none')).toBeUndefined();
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

describe('getBossByName', () => {
	it('returns the matching boss', () => {
		expect(getBossByName('Azhdaha')?.name).toBe('Azhdaha');
	});

	it('returns undefined for unknown names', () => {
		expect(getBossByName('Unknown')).toBeUndefined();
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

describe('getRandomBosses', () => {
	it('returns the requested number of distinct bosses', () => {
		const bosses = getRandomBosses({ weekly: true }, 3);
		expect(bosses).toHaveLength(3);
		expect(new Set(bosses.map((boss) => boss.name)).size).toBe(3);
	});

	it('caps at the pool size', () => {
		const bosses = getRandomBosses({ weekly: true }, 100);
		expect(bosses.length).toBeLessThan(100);
	});
});

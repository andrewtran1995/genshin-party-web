import { describe, expect, it } from 'vitest';
import {
	getAllBossNames,
	getBossByName,
	getBosses,
	getRandomBosses,
	parseBossFilters,
	rollBossUrl,
	serializeBossFilters
} from './bosses';
import { cardVariants } from '$lib/card-variant';

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

	it('excludes bosses by name when requested', () => {
		const allNames = getBosses().map((boss) => boss.name);
		const excluded = allNames.slice(0, 5);
		const bosses = getBosses({ exclude: excluded });
		expect(bosses.some((boss) => excluded.includes(boss.name))).toBe(false);
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

	it('includes a valid variant query param', () => {
		const url = rollBossUrl({});
		expect(url).toBeDefined();
		if (!url) throw new Error('expected a url');
		const variant = new URLSearchParams(url.split('?')[1]).get('variant');
		expect(cardVariants).toContain(variant);
	});

	it('includes one variant per boss for a gauntlet roll', () => {
		const url = rollBossUrl({ gauntlet: true });
		expect(url).toBeDefined();
		if (!url) throw new Error('expected a url');
		const variant = new URLSearchParams(url.split('?')[1]).get('variant');
		const variants = variant?.split(',') ?? [];
		expect(variants).toHaveLength(3);
		expect(variants.every((v) => (cardVariants as readonly string[]).includes(v))).toBe(true);
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

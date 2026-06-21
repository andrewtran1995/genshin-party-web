import { constant, filter, once, pipe } from 'remeda';
import type { Char, Element, Enemy, Rarity } from '$lib/types';

const loadChars = once(async (): Promise<Char[]> => {
	const genshinDb = await import('genshin-db');
	const chars = genshinDb.default.characters('names', {
		matchCategories: true,
		verboseCategories: true
	});
	return chars.map((c) => ({
		name: c.name,
		rarity: c.rarity,
		elementType: c.elementType
	}));
});

const loadEnemies = once(async (): Promise<Enemy[]> => {
	const genshinDb = await import('genshin-db');
	const enemies = genshinDb.default.enemies('names', {
		matchCategories: true,
		verboseCategories: true
	});
	return enemies.map((e) => ({
		name: e.name,
		description: e.description,
		enemyType: e.enemyType,
		categoryType: e.categoryType
	}));
});

interface GetCharsOptions {
	element?: Element | undefined;
	rarity?: Rarity | undefined;
}

export async function getChars({ element, rarity }: GetCharsOptions = {}): Promise<Char[]> {
	const elementToken = element ? `ELEMENT_${element.toUpperCase()}` : undefined;
	return pipe(
		await loadChars(),
		filter(rarity ? (c) => c.rarity === Number(rarity) : constant(true)),
		filter(elementToken ? (c) => c.elementType === elementToken : constant(true)),
		filter((c) => c.name !== 'Aether')
	);
}

interface GetBossesOptions {
	weekly?: boolean | undefined;
}

export async function getBosses({ weekly = true }: GetBossesOptions = {}): Promise<Enemy[]> {
	const enemies = await loadEnemies();
	return enemies
		.filter(weekly ? (e) => e.categoryType === 'CODEX_SUBTYPE_BOSS' : (e) => e.enemyType === 'BOSS')
		.filter((e) => e.name !== 'Stormterror');
}

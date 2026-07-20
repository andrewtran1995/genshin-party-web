import type { Char, Element, Enemy } from '../../src/lib/types.js';

export interface RawChar {
	id: number;
	name: string;
	title: string;
	rarity: number;
	elementType: string;
	elementText: string;
	weaponText: string;
	region: string;
	images: {
		filename_gachaSplash?: string | null;
		filename_icon?: string | null;
		mihoyo_icon?: string | null;
	};
	url?: { fandom?: string | null } | null;
}

export interface RawEnemy {
	id: number;
	name: string;
	description: string;
	categoryType: string;
	enemyType: string;
	images?: { filename_icon?: string | null } | null;
}

export const EXCLUDED_CHAR = 'Aether';
export const EXCLUDED_BOSS = 'Stormterror';
const WEEKLY_CODEX_TYPE = 'CODEX_SUBTYPE_BOSS';

/** `ELEMENT_PYRO` → `pyro`, matching the `elements` form values. */
export const toElement = (elementType: string): Element =>
	elementType.replace(/^ELEMENT_/, '').toLowerCase() as Element;

const derivePortrait = (images: RawChar['images']): string | undefined => {
	const splash =
		images.filename_gachaSplash ??
		images.filename_icon?.replace('UI_AvatarIcon_', 'UI_Gacha_AvatarImg_');
	return splash ? `https://enka.network/ui/${splash}.png` : undefined;
};

export const trimCharacters = (rawChars: readonly RawChar[]): Char[] =>
	rawChars
		.filter((char) => char.name !== EXCLUDED_CHAR)
		.map((char) => ({
			id: char.id,
			name: char.name,
			title: char.title,
			rarity: Number(char.rarity) as 4 | 5,
			element: toElement(char.elementType),
			elementText: char.elementText,
			weaponText: char.weaponText,
			region: char.region,
			portrait: derivePortrait(char.images),
			icon: char.images.mihoyo_icon ?? undefined,
			fandomUrl: char.url?.fandom ?? undefined
		}));

export const isBoss = (enemy: RawEnemy): boolean =>
	enemy.name !== EXCLUDED_BOSS &&
	(enemy.enemyType === 'BOSS' || enemy.categoryType === WEEKLY_CODEX_TYPE);

export const filterBossEnemies = (rawEnemies: readonly RawEnemy[]): RawEnemy[] =>
	rawEnemies.filter(isBoss);

export const trimBoss = (enemy: RawEnemy, icon: string | undefined): Enemy => ({
	name: enemy.name,
	description: enemy.description,
	categoryType: enemy.categoryType,
	enemyType: enemy.enemyType,
	icon
});

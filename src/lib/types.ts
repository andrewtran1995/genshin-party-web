export const rarities = ['4', '5'] as const;
export type Rarity = (typeof rarities)[number];

export const elements = [
	'anemo',
	'cryo',
	'dendro',
	'electro',
	'geo',
	'hydro',
	'pyro',
	'none'
] as const;
export type Element = (typeof elements)[number];

export interface Char {
	name: string;
	rarity: number;
	elementType: string;
}

export interface Enemy {
	name: string;
	description: string;
	enemyType: string;
	categoryType: string;
}

export interface PlayerChoice {
	char: Char;
	isMain: boolean;
	number: number;
}

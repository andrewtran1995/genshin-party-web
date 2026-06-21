// TODO: Once the genshin-db integration lands, add Char/Enemy/PlayerChoice
// types here. For now this file just holds the constants that drive form
// inputs so the UI scaffolding compiles.

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

import type { Element } from '$lib/types';

export const ELEMENT_ICONS: Record<Element, string | undefined> = {
	anemo: '/icons/elements/anemo.png',
	cryo: '/icons/elements/cryo.png',
	dendro: '/icons/elements/dendro.png',
	electro: '/icons/elements/electro.png',
	geo: '/icons/elements/geo.png',
	hydro: '/icons/elements/hydro.png',
	pyro: '/icons/elements/pyro.png',
	none: undefined
};

export const getElementIconUrl = (element: Element): string | undefined => ELEMENT_ICONS[element];

export const WEAPON_ICONS: Record<string, string | undefined> = {
	sword: '/icons/weapons/sword.png',
	claymore: '/icons/weapons/claymore.png',
	bow: '/icons/weapons/bow.png',
	polearm: '/icons/weapons/polearm.png',
	catalyst: '/icons/weapons/catalyst.png'
};

export const getWeaponIconUrl = (weapon: string): string | undefined =>
	WEAPON_ICONS[weapon.toLowerCase()];

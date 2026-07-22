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

// Accent hues from CharCard's per-element palette, reused here for the "any element" swatch.
export const ELEMENT_ACCENT_COLORS: Record<Exclude<Element, 'none'>, string> = {
	anemo: 'oklch(78% 0.13 172deg)',
	cryo: 'oklch(85% 0.08 213deg)',
	dendro: 'oklch(80% 0.16 132deg)',
	electro: 'oklch(71% 0.15 305deg)',
	geo: 'oklch(80% 0.14 86deg)',
	hydro: 'oklch(75% 0.13 231deg)',
	pyro: 'oklch(72% 0.17 42deg)'
};

export const WEAPON_ICONS: Record<string, string | undefined> = {
	sword: '/icons/weapons/sword.png',
	claymore: '/icons/weapons/claymore.png',
	bow: '/icons/weapons/bow.png',
	polearm: '/icons/weapons/polearm.png',
	catalyst: '/icons/weapons/catalyst.png'
};

export const getWeaponIconUrl = (weapon: string): string | undefined =>
	WEAPON_ICONS[weapon.toLowerCase()];

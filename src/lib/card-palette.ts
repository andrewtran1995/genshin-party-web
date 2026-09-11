import type { Char } from '$lib/types';

/** CSS custom properties a card's colour scheme sets, consumed by `CardChrome.svelte`. */
export interface CardPalette {
	'--stock': string;
	'--stock-2': string;
	'--el': string;
	'--el-splash': string;
	'--ink': string;
	'--muted': string;
	'--frame': string;
	'--frame-2': string;
	'--foil-max': string;
}

// Element identity: dark stock tinted toward the element, a bright splash for
// the wish-burst, and the accent for the type icon + edge.
const ELEMENT_PALETTES: Record<string, Partial<CardPalette>> = {
	pyro: {
		'--stock': 'oklch(19% 0.03 40deg)',
		'--stock-2': 'oklch(24% 0.04 40deg)',
		'--el': 'oklch(72% 0.17 42deg)',
		'--el-splash': 'oklch(78% 0.18 46deg)',
		'--ink': 'oklch(97% 0.012 40deg)',
		'--muted': 'oklch(79% 0.04 42deg)'
	},
	hydro: {
		'--stock': 'oklch(19% 0.03 235deg)',
		'--stock-2': 'oklch(24% 0.04 235deg)',
		'--el': 'oklch(75% 0.13 231deg)',
		'--el-splash': 'oklch(83% 0.12 228deg)',
		'--ink': 'oklch(97% 0.012 235deg)',
		'--muted': 'oklch(80% 0.04 231deg)'
	},
	anemo: {
		'--stock': 'oklch(19% 0.028 175deg)',
		'--stock-2': 'oklch(24% 0.038 175deg)',
		'--el': 'oklch(78% 0.13 172deg)',
		'--el-splash': 'oklch(85% 0.12 168deg)',
		'--ink': 'oklch(97% 0.012 175deg)',
		'--muted': 'oklch(81% 0.04 172deg)'
	},
	electro: {
		'--stock': 'oklch(19% 0.032 305deg)',
		'--stock-2': 'oklch(24% 0.042 305deg)',
		'--el': 'oklch(71% 0.15 305deg)',
		'--el-splash': 'oklch(78% 0.16 305deg)',
		'--ink': 'oklch(97% 0.012 305deg)',
		'--muted': 'oklch(80% 0.04 305deg)'
	},
	dendro: {
		'--stock': 'oklch(19% 0.03 130deg)',
		'--stock-2': 'oklch(24% 0.04 130deg)',
		'--el': 'oklch(80% 0.16 132deg)',
		'--el-splash': 'oklch(86% 0.17 128deg)',
		'--ink': 'oklch(97% 0.012 130deg)',
		'--muted': 'oklch(82% 0.05 132deg)'
	},
	cryo: {
		'--stock': 'oklch(20% 0.02 215deg)',
		'--stock-2': 'oklch(25% 0.03 215deg)',
		'--el': 'oklch(85% 0.08 213deg)',
		'--el-splash': 'oklch(91% 0.07 210deg)',
		'--ink': 'oklch(97% 0.012 215deg)',
		'--muted': 'oklch(83% 0.03 213deg)'
	},
	geo: {
		'--stock': 'oklch(20% 0.03 88deg)',
		'--stock-2': 'oklch(25% 0.04 88deg)',
		'--el': 'oklch(80% 0.14 86deg)',
		'--el-splash': 'oklch(87% 0.15 88deg)',
		'--ink': 'oklch(97% 0.012 88deg)',
		'--muted': 'oklch(82% 0.045 86deg)'
	}
};

const DEFAULT_PALETTE: CardPalette = {
	'--stock': 'oklch(18% 0.02 280deg)',
	'--stock-2': 'oklch(22% 0.025 280deg)',
	'--el': 'oklch(72% 0 0deg)',
	'--el-splash': 'oklch(80% 0 0deg)',
	'--ink': 'oklch(96% 0.01 280deg)',
	'--muted': 'oklch(76% 0.02 280deg)',
	// Rarity (4★ default; 5★ overrides below)
	'--frame': 'oklch(68% 0.11 300deg)',
	'--frame-2': 'oklch(54% 0.13 300deg)',
	'--foil-max': '0.35'
};

const RARITY_5_PALETTE: Partial<CardPalette> = {
	'--frame': 'oklch(83% 0.13 86deg)',
	'--frame-2': 'oklch(68% 0.13 74deg)',
	'--foil-max': '0.6'
};

/** The card-face colour scheme for a character, driven by element and rarity. */
export const charCardPalette = (char: Pick<Char, 'element' | 'rarity'>): CardPalette => ({
	...DEFAULT_PALETTE,
	...ELEMENT_PALETTES[char.element],
	...(char.rarity === 5 ? RARITY_5_PALETTE : {})
});

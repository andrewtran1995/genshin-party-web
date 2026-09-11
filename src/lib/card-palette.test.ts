import { describe, expect, it } from 'vitest';
import { elements } from '$lib/types';
import { charCardPalette } from './card-palette';

describe('charCardPalette', () => {
	it('picks a distinct palette for every element', () => {
		const seen = new Set<string>();
		for (const element of elements) {
			const palette = charCardPalette({ element, rarity: 4 });
			seen.add(JSON.stringify(palette));
		}
		expect(seen.size).toBe(elements.length);
	});

	it('applies the brighter rarity-5 frame over the rarity-4 default', () => {
		const rarity4 = charCardPalette({ element: 'pyro', rarity: 4 });
		const rarity5 = charCardPalette({ element: 'pyro', rarity: 5 });

		expect(rarity5['--frame']).not.toBe(rarity4['--frame']);
		expect(rarity5['--foil-max']).toBe('0.6');
		expect(rarity4['--foil-max']).toBe('0.35');

		// Element hue is untouched by rarity.
		expect(rarity5['--el']).toBe(rarity4['--el']);
	});

	it('falls back to the neutral default for an unrecognised element (e.g. the Traveler before a match)', () => {
		const palette = charCardPalette({ element: 'none', rarity: 5 });
		expect(palette['--el']).toBe('oklch(72% 0 0deg)');
	});
});

import { describe, expect, it } from 'vitest';
import {
	CARD_VARIANT_LABELS,
	cardVariants,
	isCardVariant,
	parseCardVariant,
	parseCardVariantList,
	rollCardVariant,
	serializeCardVariantList,
	type CardVariant
} from './card-variant';

describe('isCardVariant', () => {
	it('accepts every known variant', () => {
		for (const variant of cardVariants) expect(isCardVariant(variant)).toBe(true);
	});

	it('rejects unknown values', () => {
		expect(isCardVariant('shiny')).toBe(false);
		expect(isCardVariant('')).toBe(false);
	});
});

describe('rollCardVariant', () => {
	it('always returns a known variant', () => {
		for (let i = 0; i < 200; i++) {
			expect(cardVariants).toContain(rollCardVariant());
		}
	});

	it('rolls each variant roughly at its configured weight', () => {
		const counts: Record<CardVariant, number> = { normal: 0, holo: 0, 'reverse-holo': 0, foil: 0 };
		const samples = 20000;
		for (let i = 0; i < samples; i++) counts[rollCardVariant()]++;

		// Configured weights: normal 80%, foil 12%, reverse-holo 6%, holo 2%.
		expect(counts.normal / samples).toBeGreaterThan(0.75);
		expect(counts.normal / samples).toBeLessThan(0.85);
		expect(counts.foil / samples).toBeGreaterThan(0.08);
		expect(counts.foil / samples).toBeLessThan(0.16);
		expect(counts['reverse-holo'] / samples).toBeGreaterThan(0.03);
		expect(counts['reverse-holo'] / samples).toBeLessThan(0.09);
		expect(counts.holo / samples).toBeGreaterThan(0.005);
		expect(counts.holo / samples).toBeLessThan(0.04);
	});
});

describe('parseCardVariant', () => {
	it('parses a known variant', () => {
		expect(parseCardVariant('holo')).toBe('holo');
	});

	it('falls back to normal for unknown or missing values', () => {
		expect(parseCardVariant('glowing')).toBe('normal');
		expect(parseCardVariant(null)).toBe('normal');
		expect(parseCardVariant(undefined)).toBe('normal');
		expect(parseCardVariant('')).toBe('normal');
	});
});

describe('parseCardVariantList', () => {
	it('parses each comma-separated entry', () => {
		expect(parseCardVariantList('holo,foil,normal', 3)).toEqual(['holo', 'foil', 'normal']);
	});

	it('pads missing entries with normal', () => {
		expect(parseCardVariantList('holo', 3)).toEqual(['holo', 'normal', 'normal']);
	});

	it('falls back invalid entries to normal without breaking the list', () => {
		expect(parseCardVariantList('holo,bogus,foil', 3)).toEqual(['holo', 'normal', 'foil']);
	});

	it('returns an all-normal list for a missing value', () => {
		expect(parseCardVariantList(null, 2)).toEqual(['normal', 'normal']);
	});
});

describe('serializeCardVariantList', () => {
	it('round-trips with parseCardVariantList', () => {
		const variants = ['holo', 'foil', 'normal'] as const;
		const serialized = serializeCardVariantList(variants);
		expect(parseCardVariantList(serialized, 3)).toEqual(variants);
	});
});

describe('CARD_VARIANT_LABELS', () => {
	it('has no label for normal and a label for every special variant', () => {
		expect(CARD_VARIANT_LABELS.normal).toBe('');
		for (const variant of cardVariants) {
			if (variant === 'normal') continue;
			expect(CARD_VARIANT_LABELS[variant]).not.toBe('');
		}
	});
});

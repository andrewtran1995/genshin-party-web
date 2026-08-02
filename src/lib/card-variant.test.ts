import { describe, expect, it } from 'vitest';
import {
	CARD_VARIANT_FILTER_LABELS,
	CARD_VARIANT_LABELS,
	cardVariants,
	isCardVariant,
	parseCardVariant,
	parseCardVariantList,
	parseVariantOverride,
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
		const counts: Record<CardVariant, number> = { normal: 0, holo: 0, 'reverse-holo': 0 };
		const samples = 20000;
		for (let i = 0; i < samples; i++) counts[rollCardVariant()]++;

		// Configured weights: normal 80, reverse-holo 6, holo 2 (total 88).
		expect(counts.normal / samples).toBeGreaterThan(0.85);
		expect(counts.normal / samples).toBeLessThan(0.95);
		expect(counts['reverse-holo'] / samples).toBeGreaterThan(0.04);
		expect(counts['reverse-holo'] / samples).toBeLessThan(0.1);
		expect(counts.holo / samples).toBeGreaterThan(0.01);
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

describe('parseVariantOverride', () => {
	it('parses a known variant, including normal as an explicit choice', () => {
		expect(parseVariantOverride('holo')).toBe('holo');
		expect(parseVariantOverride('normal')).toBe('normal');
	});

	it('returns undefined (no override) for unknown, empty, or missing values', () => {
		expect(parseVariantOverride('glowing')).toBeUndefined();
		expect(parseVariantOverride('')).toBeUndefined();
		expect(parseVariantOverride(null)).toBeUndefined();
		expect(parseVariantOverride(undefined)).toBeUndefined();
	});

	it('returns undefined for a File value (form field mismatch)', () => {
		expect(parseVariantOverride(new File([], 'x'))).toBeUndefined();
	});
});

describe('parseCardVariantList', () => {
	it('parses each comma-separated entry', () => {
		expect(parseCardVariantList('holo,reverse-holo,normal', 3)).toEqual([
			'holo',
			'reverse-holo',
			'normal'
		]);
	});

	it('pads missing entries with normal', () => {
		expect(parseCardVariantList('holo', 3)).toEqual(['holo', 'normal', 'normal']);
	});

	it('falls back invalid entries to normal without breaking the list', () => {
		expect(parseCardVariantList('holo,bogus,reverse-holo', 3)).toEqual([
			'holo',
			'normal',
			'reverse-holo'
		]);
	});

	it('returns an all-normal list for a missing value', () => {
		expect(parseCardVariantList(null, 2)).toEqual(['normal', 'normal']);
	});
});

describe('serializeCardVariantList', () => {
	it('round-trips with parseCardVariantList', () => {
		const variants = ['holo', 'reverse-holo', 'normal'] as const;
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

describe('CARD_VARIANT_FILTER_LABELS', () => {
	it('has a non-empty label for every variant, including normal', () => {
		for (const variant of cardVariants) {
			expect(CARD_VARIANT_FILTER_LABELS[variant]).not.toBe('');
		}
	});
});

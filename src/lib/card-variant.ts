import { isIncludedIn } from 'remeda';

/**
 * A card's rolled finish, independent of rarity — any character or boss card
 * can pull any finish. `normal` is the common case; the rest are cosmetic
 * chase pulls, mirroring a TCG pack.
 */
export const cardVariants = ['normal', 'holo', 'reverse-holo'] as const;
export type CardVariant = (typeof cardVariants)[number];

export const isCardVariant = (value: string): value is CardVariant =>
	isIncludedIn(value, cardVariants);

/** Pull weights (out of the total below). Order is irrelevant to the roll. */
const CARD_VARIANT_WEIGHTS: Record<CardVariant, number> = {
	normal: 80,
	'reverse-holo': 6,
	holo: 2
};

const TOTAL_WEIGHT = Object.values(CARD_VARIANT_WEIGHTS).reduce((sum, weight) => sum + weight, 0);

/** Accessible badge text for a variant. Empty for `normal` — no badge shown. */
export const CARD_VARIANT_LABELS: Record<CardVariant, string> = {
	normal: '',
	holo: 'Holo',
	'reverse-holo': 'Reverse Holo'
};

/**
 * Dropdown label for a variant, used where `normal` needs to read as an
 * explicit choice (e.g. "force no effect") rather than the blank card badge.
 */
export const CARD_VARIANT_FILTER_LABELS: Record<CardVariant, string> = {
	normal: 'Normal',
	holo: 'Holo',
	'reverse-holo': 'Reverse Holo'
};

/** Roll a random card finish, weighted by `CARD_VARIANT_WEIGHTS`. */
export const rollCardVariant = (): CardVariant => {
	let roll = Math.random() * TOTAL_WEIGHT;
	for (const variant of cardVariants) {
		roll -= CARD_VARIANT_WEIGHTS[variant];
		if (roll < 0) return variant;
	}
	return 'normal';
};

/** Parse a single variant from a URL query value, falling back to `normal`. */
export const parseCardVariant = (value: string | null | undefined): CardVariant =>
	value && isCardVariant(value) ? value : 'normal';

/**
 * Parse a *requested* variant override from a form/URL field (e.g. the
 * character roller's "Card variant" picker). Unlike `parseCardVariant`, a
 * missing or unrecognized value means "no override" (roll randomly) rather
 * than defaulting to `normal` — `normal` here is only returned when the
 * caller explicitly asked to force it.
 */
export const parseVariantOverride = (
	value: FormDataEntryValue | null | undefined
): CardVariant | undefined =>
	typeof value === 'string' && isCardVariant(value) ? value : undefined;

/**
 * Parse a comma-separated list of variants (gauntlet URLs), padding or
 * truncating to `count` entries with `normal`.
 */
export const parseCardVariantList = (
	value: string | null | undefined,
	count: number
): CardVariant[] => {
	const parts = value ? value.split(',') : [];
	return Array.from({ length: count }, (_, i) => parseCardVariant(parts[i]));
};

/** Serialize a list of variants back into the comma-separated URL form. */
export const serializeCardVariantList = (variants: readonly CardVariant[]): string =>
	variants.join(',');

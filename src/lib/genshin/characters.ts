import type { Char, Element, Rarity } from '$lib/types';
import { isElement, isRarity } from '$lib/types';
import { CARD_VARIANT_FILTER_LABELS, rollCardVariant, type CardVariant } from '$lib/card-variant';
import charactersJson from './data/characters.json';
import { sample } from './sample';
import { encodePathSegment } from './path-segment';

// Build-time-extracted, trimmed dataset (see scripts/gen-data.ts). Static per
// `genshin-db` version, so it's loaded once as a module rather than queried.
// `Aether` is already excluded at extraction time.
const allChars = charactersJson as Char[];

/** Characters not from Teyvat — excluded by `/interactive` by default (matches
 * the CLI's `--only-teyvat`). Kept at the call site, not in the data layer. */
export const NON_TEYVAT = ['Aloy', 'Lumine'] as const;

export interface GetCharsOptions {
	element?: Element | undefined;
	rarity?: Rarity | undefined;
	/** When false, exclude Aloy and Lumine (Traveler). Default true. */
	includeTraveler?: boolean | undefined;
	/** Names to exclude from the result (e.g. already chosen characters). */
	exclude?: readonly string[] | undefined;
}

/** Eligible characters for the given filters. Mirrors the CLI's `getChars`. */
export const getChars = ({
	element,
	rarity,
	includeTraveler = true,
	exclude
}: GetCharsOptions = {}): Char[] =>
	allChars.filter(
		(char) =>
			(rarity === undefined || char.rarity === Number(rarity)) &&
			(element === undefined || char.element === element) &&
			(includeTraveler || !(NON_TEYVAT as readonly string[]).includes(char.name)) &&
			!exclude?.includes(char.name)
	);

/** Look up a character by name. */
export const getCharByName = (name: string): Char | undefined =>
	allChars.find((char) => char.name === name);

/** All character names, useful for pre-rendering entry lists. */
export const getAllCharNames = (): string[] => allChars.map((char) => char.name);

/** Return one random eligible character, or `undefined` if the pool is empty. */
export const getRandomChar = (options: GetCharsOptions = {}): Char | undefined => {
	const [char] = sample(getChars(options));
	return char;
};

/** URL flag marking that the current `variant` was explicitly requested,
 * rather than randomly rolled — so a client-side reroll knows to keep
 * forcing it instead of rolling fresh. */
export const FORCE_VARIANT_PARAM = 'forceVariant';

export const CHAR_ERROR = 'No character matches those filters.';

type FilterInput = URLSearchParams | FormData;

const getInputValue = (input: FilterInput, key: string): string => {
	const value = input.get(key);
	return typeof value === 'string' ? value : '';
};

export const parseCharFilters = (
	input: FilterInput
): Pick<GetCharsOptions, 'element' | 'rarity'> => {
	const rawElement = getInputValue(input, 'element');
	const rawRarity = getInputValue(input, 'rarity');
	const element = rawElement && isElement(rawElement) ? rawElement : undefined;
	const rarity = rawRarity && isRarity(rawRarity) ? rawRarity : undefined;
	return { element, rarity };
};

export const serializeCharFilters = ({
	element,
	rarity
}: Pick<GetCharsOptions, 'element' | 'rarity'>): string => {
	const params = new URLSearchParams();
	if (element) params.set('element', element);
	if (rarity) params.set('rarity', rarity);
	return params.toString();
};

export const rollCharUrl = (
	filters: GetCharsOptions,
	variantOverride?: CardVariant
): string | undefined => {
	const char = getRandomChar(filters);
	if (!char) return undefined;
	const params = new URLSearchParams(serializeCharFilters(filters));
	params.set('variant', variantOverride ?? rollCardVariant());
	if (variantOverride) params.set(FORCE_VARIANT_PARAM, '1');
	const path = `/char/${encodePathSegment(char.name)}`;
	return `${path}?${params.toString()}`;
};

interface CharAppliedFilters {
	element?: Element | undefined;
	rarity?: Rarity | undefined;
	forcedVariant?: CardVariant | undefined;
}

/** Human-readable labels for the filters that produced a roll, for display on
 * the character result page. */
export const charFilterLabels = ({
	element,
	rarity,
	forcedVariant
}: CharAppliedFilters): string[] => {
	const labels: string[] = [];
	if (element) labels.push(element.charAt(0).toUpperCase() + element.slice(1));
	if (rarity) labels.push(`${rarity}★`);
	if (forcedVariant) labels.push(CARD_VARIANT_FILTER_LABELS[forcedVariant]);
	return labels;
};

/** Whether a rolled character fails to satisfy the requested filters — can
 * happen when a result page is reached via a stale or hand-edited URL. */
export const charMismatchesFilters = (
	char: Pick<Char, 'element' | 'rarity'>,
	{ element, rarity }: Pick<GetCharsOptions, 'element' | 'rarity'>
): boolean => {
	if (element && char.element !== element) return true;
	if (rarity && String(char.rarity) !== rarity) return true;
	return false;
};

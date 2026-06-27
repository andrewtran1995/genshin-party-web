/**
 * Parse a comma-separated player name list and expand it to exactly four slots,
 * matching the CLI's `-p, --players` behavior.
 *
 * Expansion rules:
 * - 1 name  → [a, a, a, a]
 * - 2 names → [a, a, b, b]
 * - 3 names → [a, a, b, c]
 * - 4 names → unchanged
 * - More than 4 names → truncated to the first four
 */
export const expandPlayerNames = (raw: string): string[] => {
	const names = raw
		.split(',')
		.map((name) => name.trim())
		.filter((name) => name.length > 0);

	if (names.length === 0) return [];

	const [first, second, third] = names;
	if (names.length === 1 && first !== undefined) {
		return [first, first, first, first];
	}
	if (names.length === 2 && first !== undefined && second !== undefined) {
		return [first, first, second, second];
	}
	if (names.length === 3 && first !== undefined && second !== undefined && third !== undefined) {
		return [first, first, second, third];
	}
	return names.slice(0, 4);
};

/** Format a player label like the CLI's `formatPlayer`. */
export const formatPlayer = (number: number, names: string[]): string => {
	const name = names[number - 1];
	return name ? `Player ${number} (${name})` : `Player ${number}`;
};

/**
 * Expand a list of player names to exactly four team slots,
 * matching the CLI's `-p, --players` behavior.
 *
 * Expansion rules:
 * - 1 name  → [a, a, a, a]
 * - 2 names → [a, a, b, b]
 * - 3 names → [a, a, b, c]
 * - 4 names → unchanged
 */
export const expandPlayerNames = (names: readonly string[]): string[] => {
	const trimmed = names.map((name) => name.trim()).filter((name) => name.length > 0);

	if (trimmed.length === 0) return [];

	const [first, second, third] = trimmed;
	if (trimmed.length === 1 && first !== undefined) {
		return [first, first, first, first];
	}
	if (trimmed.length === 2 && first !== undefined && second !== undefined) {
		return [first, first, second, second];
	}
	if (trimmed.length === 3 && first !== undefined && second !== undefined && third !== undefined) {
		return [first, first, second, third];
	}
	return trimmed.slice(0, 4);
};

/** Format a player label like the CLI's `formatPlayer`. */
export const formatPlayer = (number: number, names: readonly string[]): string => {
	const name = names[number - 1]?.trim();
	return name ? `Player ${number} (${name})` : `Player ${number}`;
};

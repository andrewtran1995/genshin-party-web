import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isRarity } from '$lib/types';
import { getChars, sample } from '$lib/server/genshin';

// Characters not from Teyvat — excluded by `/interactive`'s default (matches
// the CLI's `--only-teyvat`). Kept at the call site, not in the data layer.
const NON_TEYVAT = ['Aloy', 'Lumine'];

const noStore = { 'Cache-Control': 'no-store' };

/**
 * Returns one random eligible character as JSON. Used by `/interactive`, which
 * rerolls repeatedly from the client.
 *
 * Query params:
 * - `rarity` — `4` or `5`; invalid/absent means any.
 * - `onlyTeyvat` — `false` to include the Traveler/Aloy (default excludes).
 * - `exclude` — comma-separated names already chosen (for `unique` rolls).
 */
export const GET: RequestHandler = ({ url }) => {
	const rarityParam = url.searchParams.get('rarity');
	const rarity = rarityParam !== null && isRarity(rarityParam) ? rarityParam : undefined;
	const onlyTeyvat = url.searchParams.get('onlyTeyvat') !== 'false';
	const exclude = new Set(
		(url.searchParams.get('exclude') ?? '')
			.split(',')
			.map((name) => name.trim())
			.filter((name) => name.length > 0)
	);

	const eligible = getChars({ rarity }).filter(
		(char) => !(onlyTeyvat && NON_TEYVAT.includes(char.name)) && !exclude.has(char.name)
	);

	const [char] = sample(eligible);
	if (!char) {
		return json({ error: 'No eligible character.' }, { status: 404, headers: noStore });
	}

	return json(char, { headers: noStore });
};

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getChars } from '$lib/server/genshin-db';
import { pickRandom } from '$lib/random';
import { rarities, type Rarity } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
	const rarityParam = url.searchParams.get('rarity');
	const rarity =
		rarityParam && (rarities as readonly string[]).includes(rarityParam)
			? (rarityParam as Rarity)
			: undefined;
	const onlyTeyvat = url.searchParams.get('onlyTeyvat') !== 'false';

	let candidates = await getChars({ rarity });
	if (onlyTeyvat) {
		candidates = candidates.filter((c) => c.name !== 'Aloy' && c.name !== 'Lumine');
	}
	const pick = pickRandom(candidates);
	if (!pick) {
		return json({ error: 'No character matches that filter.' }, { status: 400 });
	}
	return json({ char: pick });
};

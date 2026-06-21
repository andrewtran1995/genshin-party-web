import type { Actions, PageServerLoad } from './$types';
import { elements, rarities } from '$lib/types';

export const load: PageServerLoad = () => {
	return { elements, rarities };
};

export const actions = {
	default: () => {
		// TODO: wire in `genshin-db` via $lib/server to filter by element/rarity
		// and return one random Char. Mirrors `genshin-party char` in the CLI.
		return { todo: 'Random character picker not yet implemented.' };
	}
} satisfies Actions;

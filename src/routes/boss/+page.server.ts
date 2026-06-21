import type { Actions } from './$types';

export const actions = {
	default: () => {
		// TODO: wire in `genshin-db` via $lib/server to pick one or three random
		// bosses, honoring the gauntlet/weekly flags. Mirrors `genshin-party boss`.
		return { todo: 'Random boss picker not yet implemented.' };
	}
} satisfies Actions;

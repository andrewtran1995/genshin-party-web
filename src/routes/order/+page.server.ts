import type { Actions } from './$types';

export const actions = {
	default: () => {
		// `order` has no data dependency in the CLI either — it just shuffles
		// [1..4]. Kept inline rather than pulling in a util for one call.
		const order = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
		return { order };
	}
} satisfies Actions;

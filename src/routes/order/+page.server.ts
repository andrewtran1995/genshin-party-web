import { shuffle } from 'remeda';
import type { Actions } from './$types';

export const actions = {
	default: () => {
		// `order` has no data dependency in the CLI either — it just shuffles
		// [1..4]. Kept inline rather than pulling in a util for one call.
		const order = shuffle([1, 2, 3, 4]);
		return { order };
	}
} satisfies Actions;

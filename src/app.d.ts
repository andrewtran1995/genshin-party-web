// See https://svelte.dev/docs/kit/types#app.d.ts
import type { Char } from '$lib/types';

declare global {
	namespace App {
		interface Error {
			message: string;
			errorId?: string;
		}
		// interface Locals {}
		// interface PageData {}
		interface PageState {
			/** Set while the char-list debug panel's "all variants" view is shown as a shallow-routed overlay. */
			charAllVariants?: Char;
		}
		// interface Platform {}
	}
}

export {};

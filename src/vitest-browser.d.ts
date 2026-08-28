// Augments `vitest/browser`'s command surface with the custom command
// registered in `vitest.browser.config.ts`, so `commands.setReducedMotion(...)`
// is typed in browser-mode tests.
declare module 'vitest/browser' {
	interface BrowserCommands {
		setReducedMotion: (reduced: boolean) => Promise<void>;
	}
}

export {};

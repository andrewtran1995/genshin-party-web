import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { playwright } from '@vitest/browser-playwright';
import browserslistToEsbuild from 'browserslist-to-esbuild';
import type { Page } from 'playwright';

const buildTarget = browserslistToEsbuild();

// `prefers-reduced-motion` is a real CSS media query, so JS can't fake it —
// only the browser's actual context can. Playwright exposes that as
// `page.emulateMedia`, which the built-in provider context makes available
// as `context.page` (see `getCommandsContext` in `@vitest/browser-playwright`).
const setReducedMotion = async (context: { page: Page }, reduced: boolean) => {
	await context.page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
};

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		target: buildTarget,
		cssTarget: buildTarget
	},
	test: {
		passWithNoTests: true,
		expect: { requireAssertions: true },
		browser: {
			provider: playwright(),
			enabled: true,
			instances: [{ browser: 'chromium', headless: true }],
			api: { port: 63315 },
			commands: { setReducedMotion }
		},
		include: ['src/**/*.svelte.test.ts']
	}
});

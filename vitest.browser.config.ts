import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { playwright } from '@vitest/browser-playwright';
import browserslistToEsbuild from 'browserslist-to-esbuild';

const buildTarget = browserslistToEsbuild();

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
			api: { port: 63315 }
		},
		include: ['src/**/*.svelte.test.ts']
	}
});

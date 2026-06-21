import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
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
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});

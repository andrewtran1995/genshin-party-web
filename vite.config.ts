import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import browserslistToEsbuild from 'browserslist-to-esbuild';

const buildTarget = browserslistToEsbuild();

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	build: {
		target: buildTarget,
		cssTarget: buildTarget
	},
	test: {
		passWithNoTests: true,
		expect: { requireAssertions: true },
		environment: 'node',
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
	}
});

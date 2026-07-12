<script lang="ts">
	import type { Element } from '$lib/types';

	let { element }: { element: Element } = $props();

	// Simple, coherent stroke glyphs (Lucide-style) drawn on a 24×24 grid.
	// Element sigils, not literal illustrations. `currentColor` themes them.
	const paths: Record<Element, string[]> = {
		pyro: [
			'M12 3c1.9 2.7 4 4.6 4 7.6a4 4 0 0 1-8 0c0-1 .4-1.9 1-2.6.2 1.5.9 2.3 1.7 2.6-.6-2.4.4-4.8 1.3-7.6Z'
		],
		hydro: ['M12 3.5c3 3.8 5.5 6.5 5.5 9.6a5.5 5.5 0 0 1-11 0c0-3.1 2.5-5.8 5.5-9.6Z'],
		anemo: [
			'M4 9c1.6-2.6 5.2-3 6.7-1 1 1.4.3 3.1-1.4 3.1',
			'M20 15c-1.6 2.6-5.2 3-6.7 1-1-1.4-.3-3.1 1.4-3.1'
		],
		electro: ['M13 3 6 13h5l-2 8 8-11h-5l3-7Z'],
		dendro: ['M5 19C5 11 11 5 19 5c0 8-6 14-14 14Z', 'M9.5 14.5c1.8-2.6 3.8-4.6 6.5-5.5'],
		cryo: [
			'M12 2v20',
			'M3.5 7l17 10',
			'M20.5 7l-17 10',
			'M12 6l2-2M12 6l-2-2',
			'M12 18l2 2M12 18l-2 2'
		],
		geo: ['M6 9h12l-6 13Z', 'M6 9l3-5h6l3 5', 'M6.2 9 12 13l5.8-4'],
		none: ['M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z']
	};
</script>

<svg
	class="element-icon"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#each paths[element] as d (d)}
		<path {d} />
	{/each}
</svg>

<style>
	.element-icon {
		width: 1em;
		height: 1em;
		display: block;
		flex: none;
	}
</style>

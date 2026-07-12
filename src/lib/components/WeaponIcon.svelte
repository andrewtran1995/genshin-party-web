<script lang="ts">
	let { weapon }: { weapon: string } = $props();

	// Weapon-type glyphs, same stroke system as ElementIcon.
	const paths: Record<string, string[]> = {
		sword: ['M12 3v11', 'M8 14h8', 'M12 14v5'],
		claymore: ['M12 3l3 4v7H9V7l3-4Z', 'M8 14h8', 'M12 14v5'],
		bow: ['M7 4a11 11 0 0 1 0 16', 'M7 4v16', 'M5 12h15', 'M16 8l4 4-4 4'],
		catalyst: [
			'M4 5h5a3 3 0 0 1 3 3 3 3 0 0 1 3-3h5v11h-5a3 3 0 0 0-3 3 3 3 0 0 0-3-3H4z',
			'M12 8v11'
		],
		polearm: ['M12 3l2.2 4.2L12 8.4 9.8 7.2 12 3Z', 'M12 8.4V21']
	};

	const glyph = $derived(paths[weapon.toLowerCase()] ?? ['M12 5v14', 'M5 12h14']);
</script>

<svg
	class="weapon-icon"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#each glyph as d (d)}
		<path {d} />
	{/each}
</svg>

<style>
	.weapon-icon {
		width: 1em;
		height: 1em;
		display: block;
		flex: none;
	}
</style>

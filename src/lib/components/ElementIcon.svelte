<script lang="ts">
	import type { Element } from '$lib/types';
	import { getElementIconUrl } from '$lib/element-image';

	let { element }: { element: Element } = $props();

	const src = $derived(getElementIconUrl(element));
</script>

{#if src}
	<img class="element-icon" {src} alt="" aria-hidden="true" />
{:else}
	<svg
		class="element-icon"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		aria-hidden="true"
	>
		<circle cx="12" cy="12" r="8" />
	</svg>
{/if}

<style>
	.element-icon {
		width: 1em;
		height: 1em;
		display: block;
		flex: none;
	}

	img.element-icon {
		object-fit: contain;
	}
</style>

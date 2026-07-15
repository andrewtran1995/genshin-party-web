<script lang="ts">
	import { getWeaponIconUrl } from '$lib/weapon-image';

	let { weapon }: { weapon: string } = $props();

	const src = $derived(getWeaponIconUrl(weapon));
</script>

{#if src}
	<img class="weapon-icon" {src} alt="" aria-hidden="true" />
{:else}
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
		<path d="M12 5v14" />
		<path d="M5 12h14" />
	</svg>
{/if}

<style>
	.weapon-icon {
		width: 1em;
		height: 1em;
		display: block;
		flex: none;
	}

	img.weapon-icon {
		object-fit: contain;
	}
</style>

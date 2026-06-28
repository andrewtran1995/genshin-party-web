<script lang="ts">
	import type { Char } from '$lib/types';
	import { getCharImageUrl } from '$lib/char-image';

	interface Props {
		char: Char;
		loading?: 'eager' | 'lazy';
	}

	let { char, loading = 'lazy' }: Props = $props();

	const imageUrl = $derived(getCharImageUrl(char));
</script>

<figure class="char-card">
	{#if imageUrl}
		<img alt={char.name} {loading} src={imageUrl} width="240" height="480" />
	{/if}
	<figcaption>
		<strong>{char.name}</strong>
		<span>{char.rarity}★ {char.elementText} · {char.weaponText}</span>
		{#if char.title}<span class="title">{char.title}</span>{/if}
		{#if char.region}<span class="region">{char.region}</span>{/if}
	</figcaption>
</figure>

<style>
	.char-card img {
		height: auto;
		max-width: 100%;
	}
</style>

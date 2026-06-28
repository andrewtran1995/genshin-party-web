<script lang="ts">
	import type { Char } from '$lib/types';
	import { getCharImageUrl } from '$lib/char-image';

	interface Props {
		char: Char;
	}

	let { char }: Props = $props();

	const imageUrl = $derived(getCharImageUrl(char));
</script>

<figure class="char-card">
	{#if imageUrl}
		<img alt={char.name} loading="lazy" src={imageUrl} width="240" />
	{/if}
	<figcaption>
		<strong>{char.name}</strong>
		<span>{char.rarity}★ {char.elementText} · {char.weaponText}</span>
		{#if char.title}<span class="title">{char.title}</span>{/if}
		{#if char.region}<span class="region">{char.region}</span>{/if}
	</figcaption>
</figure>

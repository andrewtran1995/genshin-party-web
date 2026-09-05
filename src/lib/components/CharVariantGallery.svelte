<script lang="ts">
	import { resolve } from '$app/paths';
	import CharCard from '$lib/components/CharCard.svelte';
	import Link from '$lib/components/Link.svelte';
	import { CARD_VARIANT_FILTER_LABELS, cardVariants } from '$lib/card-variant';
	import type { Char } from '$lib/types';

	let { char }: { char: Char } = $props();
</script>

<h2>All card variants: {char.name}</h2>
<div class="variant-grid">
	{#each cardVariants as cardVariant (cardVariant)}
		<div class="variant-item">
			<span class="variant-label">{CARD_VARIANT_FILTER_LABELS[cardVariant]}</span>
			<div class="card-stage">
				<CharCard {char} loading="eager" variant={cardVariant} />
			</div>
		</div>
	{/each}
</div>
<p>
	<Link href={resolve('/char')}>Back to random character</Link>
</p>

<style>
	.card-stage {
		display: flex;
		justify-content: center;
	}

	.variant-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
		gap: 1.5rem;
		justify-items: center;
	}

	.variant-item {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.5rem;
		width: 100%;
		max-width: 22rem;
	}

	.variant-label {
		font-weight: 600;
		font-size: 0.95rem;
		text-align: center;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-primary-600);
	}
</style>

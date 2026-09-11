<script lang="ts">
	import type { Char } from '$lib/types';
	import type { CardVariant } from '$lib/card-variant';
	import { charCardPalette } from '$lib/card-palette';
	import CardChrome from './CardChrome.svelte';
	import ElementIcon from './ElementIcon.svelte';
	import WeaponIcon from './WeaponIcon.svelte';

	interface Props {
		char: Char;
		loading?: 'eager' | 'lazy';
		/** Play the one-shot "wish splash" entrance. Only the candidate reveal uses this. */
		reveal?: boolean;
		/** Rolled card finish. Defaults to `normal` (no special effect). */
		variant?: CardVariant | undefined;
	}

	let { char, loading = 'lazy', reveal = false, variant = 'normal' }: Props = $props();

	const imageUrl = $derived(char.portrait ?? char.icon);
	const stars = $derived('★'.repeat(char.rarity));

	// Wide splash art fills the window (cover); a square avatar (icon fallback) floats centered.
	const isPortrait = $derived(!!char.portrait);

	const palette = $derived(charCardPalette(char));
</script>

<CardChrome
	element={char.element}
	rarity={char.rarity}
	{variant}
	{reveal}
	{palette}
	{imageUrl}
	layout={{ variant: 'fill', cardAspectRatio: '5 / 7' }}
>
	{#snippet header()}
		<h3 class="card-name">{char.name}</h3>
		<span class="card-stars" aria-label={`${char.rarity}-star`} title={`${char.rarity}-star`}>
			{stars}
		</span>
	{/snippet}

	{#snippet art({ showArt, onload, onerror })}
		{#if showArt}
			<img
				class="card-art"
				class:card-art-floating={!isPortrait}
				alt={char.name}
				src={imageUrl}
				{loading}
				width="2048"
				height="1024"
				{onload}
				{onerror}
			/>
		{:else}
			<div class="card-placeholder" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
					<circle cx="12" cy="8" r="4" />
					<path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke-linecap="round" />
				</svg>
				<span>Art unavailable</span>
			</div>
		{/if}
	{/snippet}

	{#snippet typeline()}
		<ElementIcon element={char.element} />
		<span>{char.elementText}</span>
		<span class="card-dot" aria-hidden="true">·</span>
		<WeaponIcon weapon={char.weaponText} />
		<span>{char.weaponText}</span>
	{/snippet}

	{#snippet footer()}
		{#if char.title || char.region}
			<footer class="card-plate">
				{#if char.title}
					<p class="card-flavor">{char.title}</p>
				{/if}
				{#if char.region}
					<span class="card-set">{char.region}</span>
				{/if}
			</footer>
		{/if}
	{/snippet}
</CardChrome>

<style>
	.card-name {
		margin: 0;
		font-size: 7.2cqi;
		font-weight: 650;
		line-height: 1.05;
		letter-spacing: -0.02em;
		color: var(--ink);
		text-wrap: balance;
	}

	.card-stars {
		flex: none;
		font-size: 5cqi;
		letter-spacing: 0.3cqi;
		color: var(--frame);
		text-shadow: 0 0 6px color-mix(in oklch, var(--frame) 60%, transparent);
	}

	.card-art {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;

		/* Portraits are wide 2:1 splash arts; cover fills the window height and
		   crops the side effects so the figure reads large and consistently,
		   instead of shrinking into a half-height band. */
		object-fit: cover;
		object-position: center 42%;
		filter: drop-shadow(0 3cqi 4cqi rgb(0 0 0 / 40%));
	}

	/* Square avatar fallback (icon): contain and float it, centered. */
	.card-art-floating {
		object-fit: contain;
		object-position: center;
		padding: 6cqi;
	}

	.card-placeholder {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2cqi;
		color: color-mix(in oklch, var(--el) 55%, var(--muted));
	}

	.card-placeholder svg {
		width: 22cqi;
		height: 22cqi;
		opacity: 0.7;
	}

	.card-placeholder span {
		font-size: 3.6cqi;
		color: var(--muted);
	}

	/* .card-typeline is authored by CardChrome (the snippet's parent), so this
	   selector has to be fully global — the non-global half would never match
	   an ancestor scoped to a different component. */
	:global(.card-typeline .element-icon) {
		font-size: 5.4cqi;
		color: var(--el);
	}

	:global(.card-typeline .weapon-icon) {
		font-size: 5cqi;
		color: var(--muted);
	}

	.card-dot {
		color: color-mix(in oklch, var(--muted) 60%, transparent);
	}

	.card-plate {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 2cqi;
		padding-top: 2.4cqi;
		border-top: 1px solid color-mix(in oklch, var(--frame) 28%, transparent);
	}

	.card-flavor {
		margin: 0;
		font-size: 4cqi;
		font-style: italic;
		font-weight: 450;
		color: var(--ink);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.card-set {
		flex: none;
		font-size: 3.4cqi;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--frame);
		padding: 1cqi 2.4cqi;
		border-radius: 999px;
		border: 1px solid color-mix(in oklch, var(--frame) 45%, transparent);
	}
</style>

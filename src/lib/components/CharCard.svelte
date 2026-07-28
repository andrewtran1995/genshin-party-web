<script lang="ts">
	import type { Char } from '$lib/types';
	import type { CardVariant } from '$lib/card-variant';
	import CardChrome, { type CardPalette } from './CardChrome.svelte';
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

	// Element identity: dark stock tinted toward the element, a bright splash for
	// the wish-burst, and the accent for the type icon + edge.
	const ELEMENT_PALETTES: Record<string, Partial<CardPalette>> = {
		pyro: {
			'--stock': 'oklch(19% 0.03 40deg)',
			'--stock-2': 'oklch(24% 0.04 40deg)',
			'--el': 'oklch(72% 0.17 42deg)',
			'--el-splash': 'oklch(78% 0.18 46deg)',
			'--ink': 'oklch(97% 0.012 40deg)',
			'--muted': 'oklch(79% 0.04 42deg)'
		},
		hydro: {
			'--stock': 'oklch(19% 0.03 235deg)',
			'--stock-2': 'oklch(24% 0.04 235deg)',
			'--el': 'oklch(75% 0.13 231deg)',
			'--el-splash': 'oklch(83% 0.12 228deg)',
			'--ink': 'oklch(97% 0.012 235deg)',
			'--muted': 'oklch(80% 0.04 231deg)'
		},
		anemo: {
			'--stock': 'oklch(19% 0.028 175deg)',
			'--stock-2': 'oklch(24% 0.038 175deg)',
			'--el': 'oklch(78% 0.13 172deg)',
			'--el-splash': 'oklch(85% 0.12 168deg)',
			'--ink': 'oklch(97% 0.012 175deg)',
			'--muted': 'oklch(81% 0.04 172deg)'
		},
		electro: {
			'--stock': 'oklch(19% 0.032 305deg)',
			'--stock-2': 'oklch(24% 0.042 305deg)',
			'--el': 'oklch(71% 0.15 305deg)',
			'--el-splash': 'oklch(78% 0.16 305deg)',
			'--ink': 'oklch(97% 0.012 305deg)',
			'--muted': 'oklch(80% 0.04 305deg)'
		},
		dendro: {
			'--stock': 'oklch(19% 0.03 130deg)',
			'--stock-2': 'oklch(24% 0.04 130deg)',
			'--el': 'oklch(80% 0.16 132deg)',
			'--el-splash': 'oklch(86% 0.17 128deg)',
			'--ink': 'oklch(97% 0.012 130deg)',
			'--muted': 'oklch(82% 0.05 132deg)'
		},
		cryo: {
			'--stock': 'oklch(20% 0.02 215deg)',
			'--stock-2': 'oklch(25% 0.03 215deg)',
			'--el': 'oklch(85% 0.08 213deg)',
			'--el-splash': 'oklch(91% 0.07 210deg)',
			'--ink': 'oklch(97% 0.012 215deg)',
			'--muted': 'oklch(83% 0.03 213deg)'
		},
		geo: {
			'--stock': 'oklch(20% 0.03 88deg)',
			'--stock-2': 'oklch(25% 0.04 88deg)',
			'--el': 'oklch(80% 0.14 86deg)',
			'--el-splash': 'oklch(87% 0.15 88deg)',
			'--ink': 'oklch(97% 0.012 88deg)',
			'--muted': 'oklch(82% 0.045 86deg)'
		}
	};

	const DEFAULT_PALETTE: CardPalette = {
		'--stock': 'oklch(18% 0.02 280deg)',
		'--stock-2': 'oklch(22% 0.025 280deg)',
		'--el': 'oklch(72% 0 0deg)',
		'--el-splash': 'oklch(80% 0 0deg)',
		'--ink': 'oklch(96% 0.01 280deg)',
		'--muted': 'oklch(76% 0.02 280deg)',
		// Rarity (4★ default; 5★ overrides below)
		'--frame': 'oklch(68% 0.11 300deg)',
		'--frame-2': 'oklch(54% 0.13 300deg)',
		'--foil-max': '0.35'
	};

	const RARITY_5_PALETTE: Partial<CardPalette> = {
		'--frame': 'oklch(83% 0.13 86deg)',
		'--frame-2': 'oklch(68% 0.13 74deg)',
		'--foil-max': '0.6'
	};

	const palette = $derived({
		...DEFAULT_PALETTE,
		...ELEMENT_PALETTES[char.element],
		...(char.rarity === 5 ? RARITY_5_PALETTE : {})
	});
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

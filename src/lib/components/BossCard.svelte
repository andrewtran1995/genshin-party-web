<script lang="ts">
	import type { Enemy } from '$lib/types';
	import type { CardVariant } from '$lib/card-variant';
	import CardChrome, { type CardPalette } from './CardChrome.svelte';

	interface Props {
		boss: Enemy;
		reveal?: boolean;
		/** Rolled card finish. Defaults to `normal` (no special effect). */
		variant?: CardVariant | undefined;
	}

	let { boss, reveal = false, variant = 'normal' }: Props = $props();

	const imageUrl = $derived(boss.icon);
	const isWeekly = $derived(boss.categoryType === 'CODEX_SUBTYPE_BOSS');
	const categoryLabel = $derived(isWeekly ? 'Weekly boss' : 'Boss');

	let expanded = $state(false);
	let descriptionEl: HTMLParagraphElement | undefined = $state();
	let isClamped = $state(false);

	const description = $derived(boss.description ?? '');

	/**
	 * A reroll swaps in a new boss on the same component instance, so the previous
	 * boss's reading state has to be dropped explicitly — otherwise a card left
	 * open before the roll stays open on the boss that replaces it. Keyed on the
	 * name, since that's the boss's identity; rerolling the same boss keeps it open.
	 */
	$effect(() => {
		if (boss.name) expanded = false;
	});

	$effect(() => {
		const el = descriptionEl;
		// Depending on the text — not just on the element — is what makes a reroll
		// re-measure: the collapsed box is a fixed three-line height, so a new
		// description never resizes it and the ResizeObserver alone would miss it.
		const text = description;
		if (!el || !text) return;
		const update = () => {
			if (!expanded) {
				isClamped = el.scrollHeight > el.clientHeight;
			}
		};
		update();
		const observer = new ResizeObserver(update);
		observer.observe(el);
		return () => {
			observer.disconnect();
		};
	});

	// Dark, menacing boss identity with a warm gold frame.
	const palette: CardPalette = {
		'--stock': 'oklch(18% 0.02 320deg)',
		'--stock-2': 'oklch(22% 0.025 320deg)',
		'--el': 'oklch(70% 0.14 25deg)',
		'--el-splash': 'oklch(78% 0.16 30deg)',
		'--ink': 'oklch(96% 0.01 320deg)',
		'--muted': 'oklch(76% 0.02 320deg)',
		'--frame': 'oklch(72% 0.1 80deg)',
		'--frame-2': 'oklch(58% 0.12 80deg)',
		'--foil-max': '0.35'
	};
</script>

<CardChrome
	{variant}
	{reveal}
	{palette}
	{imageUrl}
	layout={{ variant: 'fixed', windowAspectRatio: '2 / 1' }}
>
	{#snippet header()}
		<h3 class="card-name">{boss.name}</h3>
	{/snippet}

	{#snippet art({ showArt, onload, onerror })}
		{#if showArt}
			<img
				class="card-art"
				alt={boss.name}
				src={imageUrl}
				width="256"
				height="256"
				decoding="async"
				{onload}
				{onerror}
			/>
		{:else}
			<div class="card-placeholder" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
					<path d="M12 2L2 7l10 5 10-5-10-5z" stroke-linecap="round" stroke-linejoin="round" />
					<path d="M2 17l10 5 10-5" stroke-linecap="round" stroke-linejoin="round" />
					<path d="M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
				<span>Icon unavailable</span>
			</div>
		{/if}
	{/snippet}

	{#snippet typeline()}
		<span class="card-dot" aria-hidden="true">◈</span>
		<span>{categoryLabel}</span>
	{/snippet}

	{#snippet footer()}
		{#if boss.description}
			<footer class="card-plate">
				<p
					class="card-flavor"
					class:is-clamped={!expanded}
					class:has-overflow={isClamped && !expanded}
					class:is-expanded={expanded}
					bind:this={descriptionEl}
				>
					{boss.description}
				</p>
				<div class="card-expand-slot">
					{#if isClamped || expanded}
						<button
							class="card-expand"
							type="button"
							aria-expanded={expanded}
							onclick={() => (expanded = !expanded)}
						>
							{expanded ? 'Show less' : 'Show more'}
						</button>
					{/if}
				</div>
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

	.card-art {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		filter: drop-shadow(0 3cqi 4cqi rgb(0 0 0 / 40%));
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

	.card-dot {
		color: var(--el);
	}

	.card-plate {
		display: flex;
		flex-direction: column;
		padding-top: 2.4cqi;
		border-top: 1px solid color-mix(in oklch, var(--frame) 28%, transparent);
	}

	.card-flavor {
		position: relative;
		margin: 0;
		font-size: 4cqi;
		font-style: italic;
		font-weight: 450;
		line-height: 1.5;
		color: var(--ink);
		white-space: pre-wrap;
	}

	/* Reserve the full clamp height so a short description leaves the same
	   footprint as a clamped one — cards sit side by side on the gauntlet page. */
	.card-flavor.is-clamped {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		min-height: calc(1.5em * 3);
		overflow: hidden;
	}

	.card-flavor.is-clamped.has-overflow::after {
		content: '';
		position: absolute;
		inset: auto 0 0;
		height: 2.5em;
		background: linear-gradient(transparent, var(--stock));
		pointer-events: none;
	}

	.card-flavor.is-expanded {
		overflow: visible;
	}

	/* Holds the row open even when there's nothing to expand, so a card with a
	   short description stays as tall as one with a "Show more" button. */
	.card-expand-slot {
		display: flex;
		align-items: flex-start;
		padding-top: 1.2cqi;
		min-height: calc(3.6cqi * 1.5);
	}

	.card-expand {
		padding: 0;
		font-size: 3.6cqi;
		font-weight: 600;
		line-height: 1.5;
		color: var(--el);
		background: transparent;
		border: none;
		cursor: pointer;
	}

	.card-expand:hover,
	.card-expand:focus-visible {
		text-decoration: underline;
	}
</style>

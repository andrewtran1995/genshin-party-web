<script lang="ts">
	import type { Snippet } from 'svelte';
	import { tilt } from '$lib/tilt';
	import { CARD_VARIANT_LABELS, type CardVariant } from '$lib/card-variant';

	export interface CardPalette {
		'--stock': string;
		'--stock-2': string;
		'--el': string;
		'--el-splash': string;
		'--ink': string;
		'--muted': string;
		'--frame': string;
		'--frame-2': string;
		'--foil-max': string;
	}

	/**
	 * A portrait card sizes the card itself and lets the window fill whatever
	 * space the header/typeline/footer leave; a boss card sizes the window and
	 * lets the card grow to fit its (variable-height) footer content instead.
	 */
	export type CardLayout =
		| { variant: 'fill'; cardAspectRatio: string }
		| { variant: 'fixed'; windowAspectRatio: string };

	interface ArtSnippetParams {
		showArt: boolean;
		imgLoaded: boolean;
		onload: () => void;
		onerror: () => void;
	}

	interface Props {
		element?: string;
		rarity?: number;
		/** Rolled card finish. Defaults to `normal` (no special effect). */
		variant?: CardVariant | undefined;
		reveal?: boolean;
		palette: CardPalette;
		imageUrl: string | undefined;
		layout: CardLayout;
		art: Snippet<[ArtSnippetParams]>;
		header: Snippet;
		typeline: Snippet;
		footer: Snippet;
	}

	let {
		element,
		rarity,
		variant = 'normal',
		reveal = false,
		palette,
		imageUrl,
		layout,
		art,
		header,
		typeline,
		footer
	}: Props = $props();

	const variantLabel = $derived(CARD_VARIANT_LABELS[variant]);

	// Loaded / error state, reset whenever the source image changes.
	let imgLoaded = $state(false);
	let imgError = $state(false);
	let lastSrc: string | undefined;
	$effect(() => {
		if (imageUrl !== lastSrc) {
			lastSrc = imageUrl;
			imgLoaded = false;
			imgError = false;
		}
	});

	const showArt = $derived(!!imageUrl && !imgError);
</script>

<article
	class="card"
	class:card-reveal={reveal}
	data-element={element}
	data-rarity={rarity}
	data-variant={variant}
	style:--stock={palette['--stock']}
	style:--stock-2={palette['--stock-2']}
	style:--el={palette['--el']}
	style:--el-splash={palette['--el-splash']}
	style:--ink={palette['--ink']}
	style:--muted={palette['--muted']}
	style:--frame={palette['--frame']}
	style:--frame-2={palette['--frame-2']}
	style:--foil-max={palette['--foil-max']}
	style:aspect-ratio={layout.variant === 'fill' ? layout.cardAspectRatio : undefined}
	use:tilt
>
	<div class="card-inner" class:card-inner-fill={layout.variant === 'fill'}>
		<div class="card-glow" aria-hidden="true"></div>
		<div class="card-variant-under" aria-hidden="true"></div>

		<header class="card-header">
			{@render header()}
		</header>

		<div
			class="card-window"
			class:card-window-fill={layout.variant === 'fill'}
			class:is-loading={showArt && !imgLoaded}
			style:aspect-ratio={layout.variant === 'fixed' ? layout.windowAspectRatio : undefined}
		>
			<div class="card-splash" aria-hidden="true"></div>
			{@render art({
				showArt,
				imgLoaded,
				onload: () => (imgLoaded = true),
				onerror: () => (imgError = true)
			})}
			{#if variantLabel}
				<span class="card-variant-badge">{variantLabel}</span>
			{/if}
		</div>

		<p class="card-typeline">
			{@render typeline()}
		</p>

		{@render footer()}

		<div class="card-foil" aria-hidden="true"></div>
		<div class="card-variant-over" aria-hidden="true"></div>
	</div>
</article>

<style>
	.card {
		container-type: inline-size;
		display: block;
		width: 100%;
		max-width: 20rem;
		perspective: 1000px;
		margin: 0;
	}

	.card-inner {
		position: relative;
		width: 100%;
		height: auto;
		display: flex;
		flex-direction: column;
		padding: 3.5cqi;
		gap: 2.5cqi;
		border-radius: 14px;
		background: linear-gradient(160deg, var(--stock-2), var(--stock) 55%), var(--stock);
		border: 1.5px solid color-mix(in oklch, var(--frame) 55%, var(--stock));
		box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--frame) 30%, transparent);
		transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))
			scale(calc(1 + var(--active, 0) * 0.02));
		transform-style: preserve-3d;
		transition:
			transform 140ms cubic-bezier(0.22, 1, 0.36, 1),
			border-color 200ms ease;
		will-change: transform;
	}

	.card-inner-fill {
		height: 100%;
	}

	.card:hover .card-inner {
		border-color: color-mix(in oklch, var(--frame) 80%, var(--stock));
	}

	/* Rarity glow — blooms only on interaction, so the resting card stays crisp
	   (no ghost-card 1px-border-plus-soft-shadow tell). */
	.card-glow {
		position: absolute;
		inset: 0;
		border-radius: inherit;
		box-shadow: 0 10px 40px -8px color-mix(in oklch, var(--frame) 70%, transparent);
		opacity: var(--active, 0);
		transition: opacity 260ms ease;
		pointer-events: none;
		z-index: -1;
	}

	.card-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 2cqi;
	}

	/* Variant badge — a corner chip naming the rolled finish, so the outcome
	   reads clearly regardless of motion or color perception. Anchored to the
	   art window (not the header), so it never competes with the name/stars
	   flex row for space. */
	.card-variant-badge {
		position: absolute;
		top: 2.4cqi;
		right: 2.4cqi;
		z-index: 2;
		font-size: 3cqi;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		white-space: nowrap;
		padding: 0.8cqi 2cqi;
		border-radius: 999px;
		color: var(--ink);
		background: color-mix(in oklch, var(--frame) 70%, black);
		border: 1px solid color-mix(in oklch, var(--frame) 75%, transparent);
		box-shadow: 0 2px 6px rgb(0 0 0 / 35%);
	}

	.card-window {
		position: relative;
		width: 100%;
		border-radius: 9px;
		overflow: hidden;
		background: radial-gradient(120% 90% at 50% 100%, var(--stock-2), var(--stock) 70%);
		box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--frame) 22%, transparent);
	}

	.card-window-fill {
		flex: 1;
		min-height: 0;
	}

	.card-splash {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			75% 60% at 50% 42%,
			color-mix(in oklch, var(--el-splash) 60%, transparent),
			transparent 70%
		);
		opacity: 0.85;
	}

	.card[data-rarity='5'] .card-splash {
		background:
			radial-gradient(
				58% 46% at 50% 40%,
				color-mix(in oklch, var(--frame) 45%, transparent),
				transparent 70%
			),
			radial-gradient(
				78% 62% at 50% 44%,
				color-mix(in oklch, var(--el-splash) 65%, transparent),
				transparent 72%
			);
	}

	/* Skeleton shimmer while the remote art loads. */
	.card-window.is-loading::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			100deg,
			transparent 30%,
			color-mix(in oklch, var(--el) 22%, transparent) 50%,
			transparent 70%
		);
		background-size: 220% 100%;
		animation: shimmer 1.2s ease-in-out infinite;
	}

	@keyframes shimmer {
		from {
			background-position: 180% 0;
		}

		to {
			background-position: -80% 0;
		}
	}

	.card-typeline {
		display: flex;
		align-items: center;
		gap: 1.6cqi;
		margin: 0;
		font-size: 4.4cqi;
		font-weight: 500;
		color: var(--muted);
	}

	/* Holographic foil — pointer-tracked highlight; 5★ adds a color-shifting band. */
	.card-foil {
		position: absolute;
		inset: 0;
		border-radius: 14px;
		pointer-events: none;
		mix-blend-mode: screen;
		opacity: calc(var(--active, 0) * var(--foil-max));
		background: radial-gradient(
			32% 32% at var(--mx, 50%) var(--my, 50%),
			rgb(255 255 255 / 85%),
			transparent 60%
		);
		transition: opacity 220ms ease;
	}

	.card[data-rarity='5'] .card-foil {
		background:
			radial-gradient(
				28% 28% at var(--mx, 50%) var(--my, 50%),
				rgb(255 255 255 / 90%),
				transparent 60%
			),
			conic-gradient(
				from calc(var(--mx, 50%) * 3.6deg) at var(--mx, 50%) var(--my, 50%),
				oklch(85% 0.16 20deg),
				oklch(85% 0.16 130deg),
				oklch(85% 0.16 240deg),
				oklch(85% 0.16 330deg),
				oklch(85% 0.16 20deg)
			);
	}

	/*
	 * Variant finishes — holo / reverse-holo / foil. Each effect is scoped to
	 * its own `[data-variant='…']` selector and its own layer element, so any
	 * one of the three can be restyled or removed without touching the others
	 * or the rarity-based `.card-foil` above. `--variant-active` carries the
	 * shared resting-vs-interactive ramp (baseline visible at rest, fuller on
	 * hover/tilt); it is not shared with `--foil-max`, which stays rarity-only.
	 */
	.card-variant-under,
	.card-variant-over {
		position: absolute;
		inset: 0;
		border-radius: 14px;
		pointer-events: none;
		opacity: 0;
		transition: opacity 220ms ease;
	}

	/* Reverse holographic — the rainbow band sits *behind* the art window in
	   paint order, so the window's own opaque background hides it there; it
	   only shows through the border, header, typeline and footer areas. */
	.card[data-variant='reverse-holo'] .card-variant-under {
		mix-blend-mode: screen;
		opacity: calc(0.18 + var(--active, 0) * 0.55);
		background: conic-gradient(
			from calc(var(--mx, 50%) * 3.6deg) at var(--mx, 50%) var(--my, 50%),
			oklch(82% 0.15 30deg),
			oklch(82% 0.15 150deg),
			oklch(82% 0.15 270deg),
			oklch(82% 0.15 30deg)
		);
	}

	/* Holographic — the boldest finish: a wide, saturated rainbow sweep drawn
	   on the topmost layer, so it crosses the art as well as the frame. */
	.card[data-variant='holo'] .card-variant-over {
		mix-blend-mode: screen;
		opacity: calc(0.2 + var(--active, 0) * 0.7);
		background: conic-gradient(
			from calc(var(--mx, 50%) * 3.6deg) at var(--mx, 50%) var(--my, 50%),
			oklch(88% 0.19 10deg),
			oklch(88% 0.19 100deg),
			oklch(88% 0.19 190deg),
			oklch(88% 0.19 280deg),
			oklch(88% 0.19 10deg)
		);
	}

	/* Foil — a scattered glitter texture instead of a color sweep: three
	   differently-sized, offset dot grids read as sparkle rather than a band. */
	.card[data-variant='foil'] .card-variant-over {
		mix-blend-mode: screen;
		opacity: calc(0.15 + var(--active, 0) * 0.45);
		background-image:
			radial-gradient(circle, rgb(255 255 255 / 95%) 0.5px, transparent 1.2px),
			radial-gradient(circle, rgb(255 255 255 / 85%) 0.5px, transparent 1.2px),
			radial-gradient(circle, rgb(255 255 255 / 75%) 0.5px, transparent 1.2px);
		background-size:
			9px 9px,
			15px 15px,
			21px 21px;
		background-position:
			0 0,
			5px 8px,
			11px 3px;
	}

	/* One-shot wish-splash entrance, scoped to the candidate reveal. */
	.card-reveal .card-inner {
		animation: reveal-in 460ms cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	.card-reveal .card-splash {
		animation: splash-in 620ms cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	@keyframes reveal-in {
		from {
			opacity: 0;
			transform: scale(0.94) translateY(2cqi);
		}

		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	@keyframes splash-in {
		0% {
			opacity: 0;
			transform: scale(1.5);
		}

		60% {
			opacity: 1;
		}

		100% {
			transform: scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.card-inner {
			transform: none !important;
			transition: border-color 200ms ease;
			will-change: auto;
		}

		.card-glow,
		.card-window.is-loading::after {
			animation: none;
		}

		.card-reveal .card-inner {
			animation: reveal-fade 200ms ease both;
		}

		.card-reveal .card-splash {
			animation: none;
		}

		/* Keep a static hint of foil so 5★ still reads as a chase card. */
		.card[data-rarity='5'] .card-foil {
			opacity: 0.16;
			background: linear-gradient(120deg, transparent 40%, rgb(255 255 255 / 50%), transparent 60%);
		}

		@keyframes reveal-fade {
			from {
				opacity: 0;
			}

			to {
				opacity: 1;
			}
		}
	}
</style>

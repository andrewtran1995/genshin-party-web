<script lang="ts">
	import type { Char } from '$lib/types';
	import { tilt } from '$lib/tilt';
	import ElementIcon from './ElementIcon.svelte';
	import WeaponIcon from './WeaponIcon.svelte';

	interface Props {
		char: Char;
		loading?: 'eager' | 'lazy';
		/** Play the one-shot "wish splash" entrance. Only the candidate reveal uses this. */
		reveal?: boolean;
	}

	let { char, loading = 'lazy', reveal = false }: Props = $props();

	const imageUrl = $derived(char.portrait ?? char.icon);
	const stars = $derived('★'.repeat(char.rarity));

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
	// Wide splash art fills the window (cover); a square avatar (icon fallback) floats centered.
	const isPortrait = $derived(!!char.portrait && !imgError);
</script>

<article
	class="card"
	class:card-reveal={reveal}
	data-element={char.element}
	data-rarity={char.rarity}
	use:tilt
>
	<div class="card-inner">
		<div class="card-glow" aria-hidden="true"></div>

		<header class="card-header">
			<h3 class="card-name">{char.name}</h3>
			<span class="card-stars" aria-label={`${char.rarity}-star`} title={`${char.rarity}-star`}>
				{stars}
			</span>
		</header>

		<div class="card-window" class:is-loading={showArt && !imgLoaded}>
			<div class="card-splash" aria-hidden="true"></div>
			{#if showArt}
				<img
					class="card-art"
					class:card-art-floating={!isPortrait}
					alt={char.name}
					src={imageUrl}
					{loading}
					width="2048"
					height="1024"
					onload={() => (imgLoaded = true)}
					onerror={() => (imgError = true)}
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
		</div>

		<p class="card-typeline">
			<ElementIcon element={char.element} />
			<span>{char.elementText}</span>
			<span class="card-dot" aria-hidden="true">·</span>
			<WeaponIcon weapon={char.weaponText} />
			<span>{char.weaponText}</span>
		</p>

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

		<div class="card-foil" aria-hidden="true"></div>
	</div>
</article>

<style>
	/* --- Element identity: dark stock tinted toward the element, a bright
	   splash for the wish-burst, and the accent for the type icon + edge. --- */
	.card {
		/* Element identity (neutral fallback) */
		--stock: oklch(18% 0.02 280deg);
		--stock-2: oklch(22% 0.025 280deg);
		--el: oklch(72% 0 0deg);
		--el-splash: oklch(80% 0 0deg);
		--ink: oklch(96% 0.01 280deg);
		--muted: oklch(76% 0.02 280deg);

		/* Rarity (4★ default; 5★ overrides below) */
		--frame: oklch(68% 0.11 300deg);
		--frame-2: oklch(54% 0.13 300deg);
		--foil-max: 0.35;

		container-type: inline-size;
		display: block;
		width: 100%;
		max-width: 20rem;
		aspect-ratio: 5 / 7;
		perspective: 1000px;
		margin: 0;
	}

	.card[data-element='pyro'] {
		--stock: oklch(19% 0.03 40deg);
		--stock-2: oklch(24% 0.04 40deg);
		--el: oklch(72% 0.17 42deg);
		--el-splash: oklch(78% 0.18 46deg);
		--ink: oklch(97% 0.012 40deg);
		--muted: oklch(79% 0.04 42deg);
	}

	.card[data-element='hydro'] {
		--stock: oklch(19% 0.03 235deg);
		--stock-2: oklch(24% 0.04 235deg);
		--el: oklch(75% 0.13 231deg);
		--el-splash: oklch(83% 0.12 228deg);
		--ink: oklch(97% 0.012 235deg);
		--muted: oklch(80% 0.04 231deg);
	}

	.card[data-element='anemo'] {
		--stock: oklch(19% 0.028 175deg);
		--stock-2: oklch(24% 0.038 175deg);
		--el: oklch(78% 0.13 172deg);
		--el-splash: oklch(85% 0.12 168deg);
		--ink: oklch(97% 0.012 175deg);
		--muted: oklch(81% 0.04 172deg);
	}

	.card[data-element='electro'] {
		--stock: oklch(19% 0.032 305deg);
		--stock-2: oklch(24% 0.042 305deg);
		--el: oklch(71% 0.15 305deg);
		--el-splash: oklch(78% 0.16 305deg);
		--ink: oklch(97% 0.012 305deg);
		--muted: oklch(80% 0.04 305deg);
	}

	.card[data-element='dendro'] {
		--stock: oklch(19% 0.03 130deg);
		--stock-2: oklch(24% 0.04 130deg);
		--el: oklch(80% 0.16 132deg);
		--el-splash: oklch(86% 0.17 128deg);
		--ink: oklch(97% 0.012 130deg);
		--muted: oklch(82% 0.05 132deg);
	}

	.card[data-element='cryo'] {
		--stock: oklch(20% 0.02 215deg);
		--stock-2: oklch(25% 0.03 215deg);
		--el: oklch(85% 0.08 213deg);
		--el-splash: oklch(91% 0.07 210deg);
		--ink: oklch(97% 0.012 215deg);
		--muted: oklch(83% 0.03 213deg);
	}

	.card[data-element='geo'] {
		--stock: oklch(20% 0.03 88deg);
		--stock-2: oklch(25% 0.04 88deg);
		--el: oklch(80% 0.14 86deg);
		--el-splash: oklch(87% 0.15 88deg);
		--ink: oklch(97% 0.012 88deg);
		--muted: oklch(82% 0.045 86deg);
	}

	/* --- Rarity: gold 5★ vs violet 4★ frame + foil strength. --- */
	.card[data-rarity='5'] {
		--frame: oklch(83% 0.13 86deg);
		--frame-2: oklch(68% 0.13 74deg);
		--foil-max: 0.6;
	}

	.card-inner {
		position: relative;
		width: 100%;
		height: 100%;
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

	.card-window {
		position: relative;
		flex: 1;
		min-height: 0;
		border-radius: 9px;
		overflow: hidden;
		background: radial-gradient(120% 90% at 50% 100%, var(--stock-2), var(--stock) 70%);
		box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--frame) 22%, transparent);
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

	/* Skeleton shimmer while the remote portrait loads. */
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

	.card-typeline :global(.element-icon) {
		font-size: 5.4cqi;
		color: var(--el);
	}

	.card-typeline :global(.weapon-icon) {
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

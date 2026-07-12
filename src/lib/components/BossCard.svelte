<script lang="ts">
	import type { Enemy } from '$lib/types';
	import { getBossImageUrl } from '$lib/boss-image';

	interface Props {
		boss: Enemy;
		loading?: 'eager' | 'lazy';
		reveal?: boolean;
	}

	let { boss, loading = 'lazy', reveal = false }: Props = $props();

	const imageUrl = $derived(getBossImageUrl(boss));
	const isWeekly = $derived(boss.categoryType === 'CODEX_SUBTYPE_BOSS');
	const categoryLabel = $derived(isWeekly ? 'Weekly boss' : 'Boss');

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

	function tilt(node: HTMLElement) {
		const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
		const MAX = 7;
		let frame = 0;

		function onMove(event: PointerEvent) {
			if (!canHover.matches || reduce.matches) return;
			const rect = node.getBoundingClientRect();
			const px = (event.clientX - rect.left) / rect.width;
			const py = (event.clientY - rect.top) / rect.height;
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				node.style.setProperty('--rx', `${(0.5 - py) * MAX}deg`);
				node.style.setProperty('--ry', `${(px - 0.5) * MAX}deg`);
				node.style.setProperty('--mx', `${px * 100}%`);
				node.style.setProperty('--my', `${py * 100}%`);
				node.style.setProperty('--active', '1');
			});
		}
		function reset() {
			cancelAnimationFrame(frame);
			node.style.setProperty('--rx', '0deg');
			node.style.setProperty('--ry', '0deg');
			node.style.setProperty('--active', '0');
		}

		node.addEventListener('pointermove', onMove);
		node.addEventListener('pointerleave', reset);
		return {
			destroy() {
				cancelAnimationFrame(frame);
				node.removeEventListener('pointermove', onMove);
				node.removeEventListener('pointerleave', reset);
			}
		};
	}
</script>

<article class="card boss-card" class:card-reveal={reveal} use:tilt>
	<div class="card-inner">
		<div class="card-glow" aria-hidden="true"></div>

		<header class="card-header">
			<h3 class="card-name">{boss.name}</h3>
			<span class="card-category">{categoryLabel}</span>
		</header>

		<div class="card-window" class:is-loading={showArt && !imgLoaded}>
			<div class="card-splash" aria-hidden="true"></div>
			{#if showArt}
				<img
					class="card-art"
					alt={boss.name}
					src={imageUrl}
					{loading}
					width="512"
					height="512"
					onload={() => (imgLoaded = true)}
					onerror={() => (imgError = true)}
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
		</div>

		{#if boss.description}
			<div class="card-body">
				<p class="card-description">{boss.description}</p>
			</div>
		{/if}

		<div class="card-foil" aria-hidden="true"></div>
	</div>
</article>

<style>
	.boss-card {
		/* Dark, menacing boss identity with a warm gold frame. */
		--stock: oklch(18% 0.02 320deg);
		--stock-2: oklch(22% 0.025 320deg);
		--el: oklch(70% 0.14 25deg);
		--el-splash: oklch(78% 0.16 30deg);
		--ink: oklch(96% 0.01 320deg);
		--muted: oklch(76% 0.02 320deg);
		--frame: oklch(72% 0.1 80deg);
		--frame-2: oklch(58% 0.12 80deg);
		--foil-max: 0.35;

		container-type: inline-size;
		display: block;
		width: 100%;
		max-width: 24rem;
		perspective: 1000px;
		margin: 0;
	}

	.card-inner {
		position: relative;
		width: 100%;
		height: auto;
		display: flex;
		flex-direction: column;
		padding: 4cqi;
		gap: 3cqi;
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

	.card-category {
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

	.card-window {
		position: relative;
		align-self: center;
		width: 40cqi;
		aspect-ratio: 1 / 1;
		flex: none;
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

	.card-art {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		object-position: center;
		padding: 5cqi;
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

	/* Skeleton shimmer while the remote icon loads. */
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

	.card-body {
		padding-top: 2cqi;
		border-top: 1px solid color-mix(in oklch, var(--frame) 28%, transparent);
	}

	.card-description {
		margin: 0;
		font-size: 4.4cqi;
		font-weight: 450;
		line-height: 1.55;
		color: var(--ink);
		white-space: pre-wrap;
	}

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

	/* One-shot reveal entrance. */
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

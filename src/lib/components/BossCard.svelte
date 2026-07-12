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

	let canvasEl: HTMLCanvasElement | undefined = $state();
	let imgLoaded = $state(false);
	let imgError = $state(false);

	let expanded = $state(false);
	let descriptionEl: HTMLParagraphElement | undefined = $state();
	let isClamped = $state(false);

	$effect(() => {
		const el = descriptionEl;
		if (!el) return;
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

	function resizeCanvas(canvas: HTMLCanvasElement) {
		const rect = canvas.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;
		const width = Math.max(1, Math.round(rect.width * dpr));
		const height = Math.max(1, Math.round(rect.height * dpr));
		if (canvas.width !== width || canvas.height !== height) {
			canvas.width = width;
			canvas.height = height;
		}
	}

	function drawPlaceholder(canvas: HTMLCanvasElement) {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const { width, height } = canvas;
		ctx.clearRect(0, 0, width, height);

		const cx = width / 2;
		const cy = height / 2;
		const size = Math.min(width, height) * 0.25;

		ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
		ctx.lineWidth = Math.max(2, width * 0.015);
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';

		ctx.beginPath();
		ctx.moveTo(cx, cy - size);
		ctx.lineTo(cx + size * 0.866, cy + size * 0.5);
		ctx.lineTo(cx - size * 0.866, cy + size * 0.5);
		ctx.closePath();
		ctx.stroke();
	}

	function drawIcon(canvas: HTMLCanvasElement, url: string) {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.loading = loading;
		img.decoding = loading === 'eager' ? 'sync' : 'async';

		img.onload = () => {
			imgLoaded = true;
			imgError = false;
			resizeCanvas(canvas);
			const ctx = canvas.getContext('2d');
			if (!ctx) return;
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			// The canvas matches the icon's 1:1 ratio, so cover fills it with no padding.
			const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
			const w = img.width * scale;
			const h = img.height * scale;
			const x = (canvas.width - w) / 2;
			const y = (canvas.height - h) / 2;
			ctx.drawImage(img, x, y, w, h);
		};

		img.onerror = () => {
			imgError = true;
			drawPlaceholder(canvas);
		};

		img.src = url;
	}

	$effect(() => {
		const canvas = canvasEl;
		if (!canvas) return;

		imgLoaded = false;
		imgError = false;

		if (imageUrl) {
			drawIcon(canvas, imageUrl);
		} else {
			drawPlaceholder(canvas);
		}

		const handleResize = () => {
			if (imageUrl && !imgError) {
				drawIcon(canvas, imageUrl);
			} else {
				drawPlaceholder(canvas);
			}
		};

		const resizeObserver = new ResizeObserver(handleResize);
		resizeObserver.observe(canvas);
		return () => {
			resizeObserver.disconnect();
		};
	});

	const showArt = $derived(!!imageUrl && !imgError);

	/**
	 * Pointer-driven tilt + foil. Enhancement only — the card is fully legible
	 * without it, so it's gated to fine pointers and disabled for reduced motion.
	 */
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
			<canvas class="card-canvas" bind:this={canvasEl} aria-hidden="true"></canvas>
		</div>

		<p class="card-typeline">
			<span class="card-dot" aria-hidden="true">◈</span>
			<span>{categoryLabel}</span>
		</p>

		{#if boss.description}
			<footer class="card-plate">
				<p
					class="card-flavor"
					class:is-clamped={!expanded}
					class:is-expanded={expanded}
					bind:this={descriptionEl}
				>
					{boss.description}
				</p>
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
			</footer>
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
		aspect-ratio: 2 / 1;
		width: 100%;
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

	.card-canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
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

	.card-typeline {
		display: flex;
		align-items: center;
		gap: 1.6cqi;
		margin: 0;
		font-size: 4.4cqi;
		font-weight: 500;
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

	.card-flavor.is-clamped {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		overflow: hidden;
	}

	.card-flavor.is-clamped::after {
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

	.card-expand {
		margin-top: 1.2cqi;
		padding: 0;
		font-size: 3.6cqi;
		font-weight: 600;
		color: var(--el);
		background: transparent;
		border: none;
		cursor: pointer;
		align-self: flex-start;
	}

	.card-expand:hover,
	.card-expand:focus-visible {
		text-decoration: underline;
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

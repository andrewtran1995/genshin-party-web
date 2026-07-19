<script lang="ts">
	import { resolve } from '$app/paths';
	import Link from '$lib/components/Link.svelte';

	const pickers = [
		{
			href: resolve('/char'),
			title: 'Random character',
			blurb: 'Roll a character with element and rarity filters.'
		},
		{
			href: resolve('/boss'),
			title: 'Random boss',
			blurb: 'Draw a single boss or a three-boss gauntlet.'
		},
		{
			href: resolve('/order'),
			title: 'Random order',
			blurb: 'Shuffle four player numbers into a pick order.'
		},
		{
			href: resolve('/interactive'),
			title: 'Interactive party',
			blurb: 'Guided four-player roll with mains, one pick at a time.'
		}
	];
</script>

<svelte:head>
	<title>genshin-party</title>
</svelte:head>

<h1>genshin-party</h1>

<p class="intro">
	Random pickers for Genshin Impact multiplayer sessions. The web counterpart to the
	<Link href="https://www.npmjs.com/package/genshin-party"><code>genshin-party</code></Link> CLI.
</p>

<nav class="picker-grid" aria-label="Pickers">
	{#each pickers as picker (picker.href)}
		<a class="picker-tile" href={picker.href}>
			<span class="picker-title">{picker.title}</span>
			<span class="picker-blurb">{picker.blurb}</span>
		</a>
	{/each}
</nav>

<style>
	.intro {
		max-width: 60ch;
		margin-block-end: var(--stack-gap, 1.5rem);
	}

	.picker-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
		gap: 1rem;
	}

	.picker-tile {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 1.1rem 1.25rem;
		border: var(--default-border-width) solid var(--color-surface-200);
		border-radius: var(--radius-container);
		background: var(--color-surface-50);
		color: var(--base-font-color);
		text-decoration: none;
		transition:
			border-color 160ms ease,
			background-color 160ms ease,
			transform 160ms ease;
	}

	.picker-title {
		font-weight: 700;
		font-size: 1.05rem;
	}

	.picker-blurb {
		font-size: 0.9rem;
		opacity: 0.75;
	}

	.picker-tile:focus-visible {
		outline: var(--default-ring-width) solid var(--color-primary-500);
		outline-offset: 2px;
	}

	@media (hover: hover) {
		.picker-tile:hover {
			border-color: var(--color-primary-500);
			background: var(--color-surface-100);
			transform: translateY(-2px);
		}
	}

	@media (prefers-color-scheme: dark) {
		.picker-tile {
			border-color: var(--color-surface-800);
			background: var(--color-surface-900);
			color: var(--base-font-color-dark);
		}

		.picker-tile:hover {
			background: var(--color-surface-800);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.picker-tile {
			transition: border-color 160ms ease;
		}

		.picker-tile:hover {
			transform: none;
		}
	}
</style>

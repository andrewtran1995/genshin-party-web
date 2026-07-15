<script lang="ts">
	import { resolve } from '$app/paths';

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

<div class="stacked">
	<div class="intro">
		<h1>genshin-party</h1>
		<p>
			Random pickers for Genshin Impact multiplayer sessions. The web counterpart to the
			<a href="https://www.npmjs.com/package/genshin-party"><code>genshin-party</code></a> CLI.
		</p>
	</div>

	<nav class="menu" aria-label="Pickers">
		{#each pickers as picker (picker.href)}
			<a class="menu-item" href={picker.href}>
				<span class="menu-title">{picker.title}</span>
				<span class="menu-blurb">{picker.blurb}</span>
			</a>
		{/each}
	</nav>
</div>

<style>
	.intro p {
		max-width: 60ch;
		color: var(--ink-muted);
	}

	.menu {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
		gap: 1rem;
	}

	.menu-item {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		min-height: var(--control-h);
		padding: 1.1rem 1.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface);
		text-decoration: none;
		color: var(--ink);
		transition:
			border-color 160ms ease,
			background-color 160ms ease,
			transform 160ms ease;
	}

	.menu-title {
		font-weight: 700;
		font-size: 1.05rem;
	}

	.menu-blurb {
		font-size: 0.9rem;
		color: var(--ink-muted);
	}

	.menu-item:focus-visible {
		outline: 2px solid var(--accent-strong);
		outline-offset: 2px;
	}

	@media (hover: hover) {
		.menu-item:hover {
			border-color: var(--accent);
			background: var(--surface-2);
			transform: translateY(-2px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.menu-item {
			transition: border-color 160ms ease;
		}

		.menu-item:hover {
			transform: none;
		}
	}
</style>

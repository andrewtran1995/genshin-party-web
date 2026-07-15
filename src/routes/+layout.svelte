<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	let { children } = $props();

	const links = [
		{ href: resolve('/char'), label: 'Character' },
		{ href: resolve('/boss'), label: 'Boss' },
		{ href: resolve('/order'), label: 'Order' },
		{ href: resolve('/interactive'), label: 'Interactive' }
	];

	const home = resolve('/');

	function isActive(href: string) {
		const path = page.url.pathname;
		if (href === home) return path === home;
		return path === href || path.startsWith(`${href}/`);
	}

	onMount(async () => {
		const host = window.location.hostname;
		if (host === 'localhost' || host === '127.0.0.1') return;

		const { injectSpeedInsights } = await import('@vercel/speed-insights/sveltekit');
		injectSpeedInsights();

		const { injectAnalytics } = await import('@vercel/analytics/sveltekit');
		injectAnalytics({ mode: 'production' });
	});
</script>

<header class="site-header">
	<nav class="site-nav" aria-label="Primary">
		<a class="brand" href={home} aria-current={isActive(home) ? 'page' : undefined}>
			genshin-party
		</a>
		<div class="nav-links">
			{#each links as link (link.href)}
				<a
					class="nav-link"
					href={link.href}
					aria-current={isActive(link.href) ? 'page' : undefined}
				>
					{link.label}
				</a>
			{/each}
		</div>
	</nav>
</header>

<main>
	{@render children()}
</main>

<style>
	.site-header {
		margin-bottom: 2rem;
		border-bottom: 1px solid var(--border);
	}

	.site-nav {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1rem;
		padding-block: 0.75rem 1rem;
	}

	.brand {
		font-family: var(--font-heading);
		font-size: 1.25rem;
		letter-spacing: 0.01em;
		text-decoration: none;
		color: var(--ink);
		margin-right: auto;
	}

	.nav-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.nav-link {
		display: inline-flex;
		align-items: center;
		min-height: 2.25rem;
		padding: 0.35rem 0.85rem;
		border-radius: var(--radius-pill);
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--ink-muted);
		text-decoration: none;
		transition:
			background-color 150ms ease,
			color 150ms ease;
	}

	.nav-link[aria-current='page'] {
		color: var(--ink);
		font-weight: 600;
		background: var(--accent-soft);
	}

	.nav-link:focus-visible {
		outline: 2px solid var(--accent-strong);
		outline-offset: 2px;
	}

	@media (hover: hover) {
		.nav-link:hover {
			color: var(--ink);
			background: var(--surface-2);
		}
	}

	/* Roomier taps on touch devices. */
	@media (pointer: coarse) {
		.nav-link {
			min-height: 2.75rem;
			padding-inline: 1rem;
		}
	}
</style>

<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import NavLink from '$lib/components/NavLink.svelte';

	let { children } = $props();

	onMount(async () => {
		const host = window.location.hostname;
		if (host === 'localhost' || host === '127.0.0.1') return;

		const { injectSpeedInsights } = await import('@vercel/speed-insights/sveltekit');
		injectSpeedInsights();

		const { injectAnalytics } = await import('@vercel/analytics/sveltekit');
		injectAnalytics({ mode: 'production' });
	});
</script>

<AppBar>
	<AppBar.Lead>
		<NavLink href={resolve('/')} class="h4">genshin-party</NavLink>
	</AppBar.Lead>
	<AppBar.Trail>
		<nav class="flex flex-wrap gap-4">
			<NavLink href={resolve('/char')}>Random character</NavLink>
			<NavLink href={resolve('/boss')}>Random boss</NavLink>
			<NavLink href={resolve('/order')}>Random order</NavLink>
			<NavLink href={resolve('/interactive')}>Interactive party</NavLink>
		</nav>
	</AppBar.Trail>
</AppBar>

<main class="mx-auto w-full max-w-5xl p-4 md:p-6">
	{@render children()}
</main>

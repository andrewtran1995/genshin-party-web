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
		<nav class="flex flex-wrap justify-end gap-x-4 gap-y-1">
			<NavLink href={resolve('/char')}>Character</NavLink>
			<NavLink href={resolve('/boss')}>Boss</NavLink>
			<NavLink href={resolve('/order')}>Order</NavLink>
			<NavLink href={resolve('/interactive')}>Interactive</NavLink>
		</nav>
	</AppBar.Trail>
</AppBar>

<main class="mx-auto w-full max-w-5xl p-4 md:p-6">
	{@render children()}
</main>

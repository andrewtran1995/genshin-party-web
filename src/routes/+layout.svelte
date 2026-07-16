<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { AppBar } from '@skeletonlabs/skeleton-svelte';

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
		<a href={resolve('/')} class="appbar-link h4">genshin-party</a>
	</AppBar.Lead>
	<AppBar.Trail>
		<nav class="flex flex-wrap gap-4">
			<a class="appbar-link" href={resolve('/char')}>Random character</a>
			<a class="appbar-link" href={resolve('/boss')}>Random boss</a>
			<a class="appbar-link" href={resolve('/order')}>Random order</a>
			<a class="appbar-link" href={resolve('/interactive')}>Interactive party</a>
		</nav>
	</AppBar.Trail>
</AppBar>

<main class="mx-auto w-full max-w-5xl p-4 md:p-6">
	{@render children()}
</main>

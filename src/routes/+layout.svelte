<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';

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

<header>
	<nav>
		<a href={resolve('/')}>Home</a> ·
		<a href={resolve('/char')}>Random character</a> ·
		<a href={resolve('/boss')}>Random boss</a> ·
		<a href={resolve('/order')}>Random order</a> ·
		<a href={resolve('/interactive')}>Interactive party</a>
	</nav>
</header>

<main>
	{@render children()}
</main>

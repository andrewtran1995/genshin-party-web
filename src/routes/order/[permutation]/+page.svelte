<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Random order — genshin-party</title>
</svelte:head>

<h1>Random selection order</h1>

<ol>
	{#each data.order as player (player)}
		<li>Player {player}</li>
	{/each}
</ol>

<p>
	<a href={resolve('/order')}>Shuffle again</a>
</p>

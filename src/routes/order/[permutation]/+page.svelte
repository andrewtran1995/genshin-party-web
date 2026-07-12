<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import RerollControls from '$lib/components/RerollControls.svelte';
	import { sample } from '$lib/genshin';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function handleReroll() {
		const order = sample([1, 2, 3, 4], 4).join(',');
		void goto(resolve(`/order/${order}`));
	}
</script>

<svelte:head>
	<title>Random order — genshin-party</title>
</svelte:head>

<div class="stacked">
	<h1>Random selection order</h1>

	<ol>
		{#each data.order as player (player)}
			<li>Player {player}</li>
		{/each}
	</ol>

	<RerollControls entry="/order" criteria={{}} onreroll={handleReroll} />
</div>

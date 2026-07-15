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

	<ol class="pick-order">
		{#each data.order as player, index (player)}
			<li>
				<span class="pick-index">{index + 1}</span>
				<span class="pick-player">Player {player}</span>
			</li>
		{/each}
	</ol>

	<RerollControls entry="/order" criteria={{}} onreroll={handleReroll} />
</div>

<style>
	.pick-order {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 24rem;
	}

	.pick-order li {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		padding: 0.65rem 0.85rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	.pick-index {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		width: 1.85rem;
		height: 1.85rem;
		border-radius: var(--radius-pill);
		background: var(--accent-soft);
		color: var(--ink);
		font-weight: 700;
		font-size: 0.9rem;
	}

	.pick-player {
		font-weight: 600;
	}
</style>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import RerollControls from '$lib/components/RerollControls.svelte';
	import { rollOrderUrl } from '$lib/genshin';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function handleReroll() {
		void goto(resolve(rollOrderUrl({ exclude: data.order.join(',') }) as Pathname));
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
		background: var(--color-surface-50);
		border: var(--default-border-width) solid var(--color-surface-200);
		border-radius: var(--radius-base);
	}

	.pick-index {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		width: 1.85rem;
		height: 1.85rem;
		border-radius: 9999px;
		background: color-mix(in oklch, var(--color-primary-500) 16%, transparent);
		font-weight: 700;
		font-size: 0.9rem;
	}

	.pick-player {
		font-weight: 600;
	}

	@media (prefers-color-scheme: dark) {
		.pick-order li {
			background: var(--color-surface-900);
			border-color: var(--color-surface-800);
		}
	}
</style>

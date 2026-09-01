<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import BossCard from '$lib/components/BossCard.svelte';
	import RerollControls from '$lib/components/RerollControls.svelte';
	import { BOSS_ERROR, rollBossUrl } from '$lib/genshin/bosses';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let rerollError = $state('');

	function handleReroll() {
		rerollError = '';
		const url = rollBossUrl({
			gauntlet: true,
			weekly: data.weekly,
			exclude: data.bosses.map((boss) => boss.name)
		});
		if (!url) {
			rerollError = BOSS_ERROR;
			return;
		}
		void goto(resolve(url as Pathname));
	}
</script>

<svelte:head>
	<title>Boss gauntlet — genshin-party</title>
</svelte:head>

<div class="stacked">
	<h1>Random boss gauntlet</h1>

	{#if data.weekly}
		<p>Filter: Weekly bosses only</p>
	{/if}

	<ul class="bosses">
		{#each data.bosses as boss, i (boss.name)}
			<li><BossCard {boss} variant={data.variants[i]} /></li>
		{/each}
	</ul>

	<RerollControls
		entry="/boss"
		criteria={{ weekly: data.weekly ? '1' : '', gauntlet: 'on' }}
		resultLabel="Rolled {data.bosses.map((boss) => boss.name).join(', ')}"
		onreroll={handleReroll}
	/>

	{#if rerollError}
		<p class="error" role="alert">{rerollError}</p>
	{/if}
</div>

<style>
	.bosses {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	/* BossCard sets `container-type: inline-size`, so it contributes no intrinsic
	   width and a `flex-basis: auto` item would collapse to zero. Flex also breaks
	   lines on the base size before shrinking, so the basis has to be small enough
	   for three to share a row; they then grow into the space, capped at the card's
	   own 20rem, and fall to fewer per row as the viewport narrows. */
	.bosses > li {
		flex: 1 1 14rem;
		max-width: 20rem;
		min-width: 0;
	}
</style>

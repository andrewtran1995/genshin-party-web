<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import BossCard from '$lib/components/BossCard.svelte';
	import RerollControls from '$lib/components/RerollControls.svelte';
	import { getRandomBosses } from '$lib/genshin';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let rerollError = $state('');

	function handleReroll() {
		rerollError = '';
		const bosses = getRandomBosses({ weekly: data.weekly }, 3);
		if (bosses.length === 0) {
			rerollError = 'No bosses match those filters.';
			return;
		}
		const names = bosses.map((boss) => boss.name);
		const query = data.weekly ? '?weekly=1' : '';
		void goto(resolve(`/boss/${names.map(encodeURIComponent).join('/')}${query}`));
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
		{#each data.bosses as boss (boss.name)}
			<li><BossCard {boss} /></li>
		{/each}
	</ul>

	<RerollControls
		entry="/boss"
		criteria={{ weekly: data.weekly ? '1' : '', gauntlet: 'on' }}
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

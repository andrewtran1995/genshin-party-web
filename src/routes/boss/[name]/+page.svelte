<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import BossCard from '$lib/components/BossCard.svelte';
	import RerollControls from '$lib/components/RerollControls.svelte';
	import { getRandomBoss } from '$lib/genshin';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchParams = $state(new URLSearchParams(''));
	let rerollError = $state('');

	function updateSearchParams() {
		searchParams = new URLSearchParams(window.location.search);
	}

	afterNavigate(updateSearchParams);
	const weekly = $derived(searchParams.get('weekly') === '1');
	const mismatch = $derived(
		(() => {
			if (weekly && data.boss.categoryType !== 'CODEX_SUBTYPE_BOSS') return true;
			return false;
		})()
	);

	function handleReroll() {
		rerollError = '';
		const boss = getRandomBoss({ weekly });
		if (!boss) {
			rerollError = 'No bosses match those filters.';
			return;
		}
		const query = weekly ? '?weekly=1' : '';
		void goto(resolve(`/boss/${encodeURIComponent(boss.name)}${query}`));
	}
</script>

<svelte:head>
	<title>{data.boss.name} — genshin-party</title>
</svelte:head>

<div class="stacked">
	<h1>Random boss</h1>

	{#if weekly}
		<p>Filter: Weekly bosses only</p>
	{/if}

	{#if mismatch}
		<p class="error" role="alert">This boss does not match the requested filter.</p>
	{/if}

	<div class="card-stage">
		<BossCard boss={data.boss} />
	</div>

	<RerollControls entry="/boss" criteria={{ weekly: weekly ? '1' : '' }} onreroll={handleReroll} />

	{#if rerollError}
		<p class="error" role="alert">{rerollError}</p>
	{/if}
</div>

<style>
	/* Horizontal centring only — `.stacked` owns the vertical rhythm. */
	.card-stage {
		display: flex;
		justify-content: center;
	}
</style>

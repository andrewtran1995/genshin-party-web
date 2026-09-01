<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { Pathname } from '$app/types';
	import BossCard from '$lib/components/BossCard.svelte';
	import RerollControls from '$lib/components/RerollControls.svelte';
	import { BOSS_ERROR, isWeeklyBoss, rollBossUrl, parseBossFilters } from '$lib/genshin/bosses';
	import { parseCardVariant } from '$lib/card-variant';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let rerollError = $state('');

	// `page.url.searchParams` throws during prerendering (this route is prerendered);
	// the browser guard defers reading it until client-side hydration.
	const { weekly } = $derived(
		browser ? parseBossFilters(page.url.searchParams) : { weekly: false }
	);
	const variant = $derived(
		browser ? parseCardVariant(page.url.searchParams.get('variant')) : 'normal'
	);
	const mismatch = $derived(weekly && !isWeeklyBoss(data.boss));

	function handleReroll() {
		rerollError = '';
		const url = rollBossUrl({ weekly, exclude: [data.boss.name] });
		if (!url) {
			rerollError = BOSS_ERROR;
			return;
		}
		void goto(resolve(url as Pathname));
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
		<BossCard boss={data.boss} {variant} />
	</div>

	<RerollControls
		entry="/boss"
		criteria={{ weekly: weekly ? '1' : '' }}
		resultLabel="Rolled {data.boss.name}"
		onreroll={handleReroll}
	/>

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

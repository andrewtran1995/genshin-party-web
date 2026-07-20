<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { Pathname } from '$app/types';
	import CharCard from '$lib/components/CharCard.svelte';
	import RerollControls from '$lib/components/RerollControls.svelte';
	import { CHAR_ERROR, rollCharUrl, parseCharFilters } from '$lib/genshin';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let rerollError = $state('');

	// `page.url.searchParams` throws during prerendering (this route is prerendered);
	// the browser guard defers reading it until client-side hydration.
	const filters = $derived(browser ? parseCharFilters(page.url.searchParams) : {});
	const element = $derived(filters.element);
	const rarity = $derived(filters.rarity);
	const appliedFilters = $derived(
		(() => {
			const labels: string[] = [];
			if (element) labels.push(element.charAt(0).toUpperCase() + element.slice(1));
			if (rarity) labels.push(`${rarity}★`);
			return labels;
		})()
	);
	const mismatch = $derived(
		(() => {
			if (element && data.char.element !== element) return true;
			if (rarity && String(data.char.rarity) !== rarity) return true;
			return false;
		})()
	);

	function handleReroll() {
		rerollError = '';
		const url = rollCharUrl({ ...filters, exclude: [data.char.name] });
		if (!url) {
			rerollError = CHAR_ERROR;
			return;
		}
		void goto(resolve(url as Pathname));
	}
</script>

<svelte:head>
	<title>{data.char.name} — genshin-party</title>
</svelte:head>

<div class="stacked">
	<h1>Random character</h1>

	{#if appliedFilters.length > 0}
		<p>Filters: {appliedFilters.join(', ')}</p>
	{/if}

	{#if mismatch}
		<p class="error" role="alert">This character does not match the requested filters.</p>
	{/if}

	<div class="card-stage">
		<CharCard char={data.char} loading="eager" />
	</div>

	<RerollControls
		entry="/char"
		criteria={{ element: element ?? '', rarity: rarity ?? '' }}
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

<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { Pathname } from '$app/types';
	import CharCard from '$lib/components/CharCard.svelte';
	import CharVariantGallery from '$lib/components/CharVariantGallery.svelte';
	import RerollControls from '$lib/components/RerollControls.svelte';
	import {
		CHAR_ERROR,
		charFilterLabels,
		charMismatchesFilters,
		rollCharUrl,
		parseCharFilters,
		FORCE_VARIANT_PARAM
	} from '$lib/genshin/characters';
	import { parseCardVariant } from '$lib/card-variant';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let rerollError = $state('');

	// `page.url.searchParams` throws during prerendering (this route is prerendered);
	// the browser guard defers reading it until client-side hydration.
	const filters = $derived(browser ? parseCharFilters(page.url.searchParams) : {});
	const variant = $derived(
		browser ? parseCardVariant(page.url.searchParams.get('variant')) : 'normal'
	);
	const allVariants = $derived(browser ? page.url.searchParams.has('allVariants') : false);
	// Only re-forced on reroll when the roll that produced this page was itself
	// forced — an unforced roll that happened to land on a chase variant must not
	// lock every future reroll to that same variant.
	const forcedVariant = $derived(
		browser && page.url.searchParams.get(FORCE_VARIANT_PARAM) ? variant : undefined
	);
	const element = $derived(filters.element);
	const rarity = $derived(filters.rarity);
	const appliedFilters = $derived(charFilterLabels({ element, rarity, forcedVariant }));
	const mismatch = $derived(charMismatchesFilters(data.char, { element, rarity }));

	function handleReroll() {
		rerollError = '';
		const url = rollCharUrl({ ...filters, exclude: [data.char.name] }, forcedVariant);
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

	{#if allVariants}
		<CharVariantGallery char={data.char} />
	{:else}
		<div class="card-stage">
			<CharCard char={data.char} loading="eager" {variant} />
		</div>

		<RerollControls
			entry="/char"
			criteria={{ element: element ?? '', rarity: rarity ?? '', variant: forcedVariant ?? '' }}
			resultLabel="Rolled {data.char.name}"
			onreroll={handleReroll}
		/>

		{#if rerollError}
			<p class="error" role="alert">{rerollError}</p>
		{/if}
	{/if}
</div>

<style>
	/* Horizontal centring only — `.stacked` owns the vertical rhythm. */
	.card-stage {
		display: flex;
		justify-content: center;
	}
</style>

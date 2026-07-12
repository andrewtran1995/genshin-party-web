<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import CharCard from '$lib/components/CharCard.svelte';
	import { isElement, isRarity } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchParams = $state(new URLSearchParams(''));

	function updateSearchParams() {
		searchParams = new URLSearchParams(window.location.search);
	}

	afterNavigate(updateSearchParams);
	const element = $derived(searchParams.get('element') ?? '');
	const rarity = $derived(searchParams.get('rarity') ?? '');
	const appliedFilters = $derived(
		(() => {
			const filters: string[] = [];
			if (isElement(element)) filters.push(element.charAt(0).toUpperCase() + element.slice(1));
			if (isRarity(rarity)) filters.push(`${rarity}★`);
			return filters;
		})()
	);
	const mismatch = $derived(
		(() => {
			if (isElement(element) && data.char.element !== element) return true;
			if (isRarity(rarity) && String(data.char.rarity) !== rarity) return true;
			return false;
		})()
	);
</script>

<svelte:head>
	<title>{data.char.name} — genshin-party</title>
</svelte:head>

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

<p>
	<a href={resolve('/char')}>Roll again</a>
</p>

<style>
	.card-stage {
		display: flex;
		justify-content: center;
		margin-block: 1.5rem;
	}
</style>

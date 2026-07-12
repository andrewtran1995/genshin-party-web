<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import CharCard from '$lib/components/CharCard.svelte';
	import RerollControls from '$lib/components/RerollControls.svelte';
	import { getRandomChar } from '$lib/genshin';
	import { isElement, isRarity } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchParams = $state(new URLSearchParams(''));
	let rerollError = $state('');

	function updateSearchParams() {
		searchParams = new URLSearchParams(window.location.search);
	}

	afterNavigate(updateSearchParams);
	const rawElement = $derived(searchParams.get('element') ?? '');
	const rawRarity = $derived(searchParams.get('rarity') ?? '');
	// Unrecognised values are dropped rather than forwarded, so the no-JS POST
	// fallback rolls with the same filters the client-side reroll would use.
	const element = $derived(isElement(rawElement) ? rawElement : undefined);
	const rarity = $derived(isRarity(rawRarity) ? rawRarity : undefined);
	const appliedFilters = $derived(
		(() => {
			const filters: string[] = [];
			if (element) filters.push(element.charAt(0).toUpperCase() + element.slice(1));
			if (rarity) filters.push(`${rarity}★`);
			return filters;
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
		const char = getRandomChar({ element, rarity });
		if (!char) {
			rerollError = 'No character matches those filters.';
			return;
		}
		const query = [element && `element=${element}`, rarity && `rarity=${rarity}`]
			.filter(Boolean)
			.join('&');
		void goto(resolve(`/char/${encodeURIComponent(char.name)}${query ? `?${query}` : ''}`));
	}
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

<RerollControls
	entry="/char"
	criteria={{ element: element ?? '', rarity: rarity ?? '' }}
	onreroll={handleReroll}
/>

{#if rerollError}
	<p class="error" role="alert">{rerollError}</p>
{/if}

<style>
	.card-stage {
		display: flex;
		justify-content: center;
		margin-block: 1.5rem;
	}
</style>

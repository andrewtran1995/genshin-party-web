<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import type { ActionData, PageData } from './$types';
	import { CHAR_ERROR, getCharByName, parseCharFilters, rollCharUrl } from '$lib/genshin';
	import { isElement } from '$lib/types';
	import { CARD_VARIANT_FILTER_LABELS, parseVariantOverride } from '$lib/card-variant';
	import ElementIcon from '$lib/components/ElementIcon.svelte';
	import AnyElementIcon from '$lib/components/AnyElementIcon.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let clientError = $state('');
	let selectedElement = $state('');
	let selectedCharacter = $state('');
	let debugError = $state('');

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		clientError = '';

		const formData = new FormData(event.currentTarget as HTMLFormElement);
		const url = rollCharUrl(
			parseCharFilters(formData),
			parseVariantOverride(formData.get('variant'))
		);
		if (!url) {
			clientError = CHAR_ERROR;
			return;
		}

		void goto(resolve(url as Pathname));
	}

	function handleDebugSubmit(event: SubmitEvent) {
		event.preventDefault();
		debugError = '';

		const formData = new FormData(event.currentTarget as HTMLFormElement);
		const name = formData.get('character');
		if (typeof name !== 'string' || !getCharByName(name)) {
			debugError = 'Select a character.';
			return;
		}

		void goto(resolve(`/char/${encodeURIComponent(name)}?allVariants=1` as Pathname));
	}
</script>

<svelte:head>
	<title>Random character — genshin-party</title>
</svelte:head>

<h1>Random character</h1>

<form class="stacked" method="POST" action="?/roll" onsubmit={handleSubmit}>
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		<label class="label">
			<span class="label-text">Element:</span>
			<div class="relative">
				<span
					class="pointer-events-none absolute top-1/2 left-2 z-10 -translate-y-1/2 text-[1.25rem]"
					aria-hidden="true"
				>
					{#if selectedElement !== '' && isElement(selectedElement)}
						<ElementIcon element={selectedElement} />
					{:else}
						<AnyElementIcon />
					{/if}
				</span>
				<select class="select pl-9" name="element" bind:value={selectedElement}>
					<option value="">Any</option>
					{#each data.elements as element (element)}
						<option value={element}>{element.charAt(0).toUpperCase() + element.slice(1)}</option>
					{/each}
				</select>
			</div>
		</label>

		<label class="label">
			<span class="label-text">Rarity:</span>
			<select class="select" name="rarity">
				<option value="">Any</option>
				{#each data.rarities as rarity (rarity)}
					<option value={rarity}>{rarity}★</option>
				{/each}
			</select>
		</label>

		<label class="label">
			<span class="label-text">Card variant:</span>
			<select class="select" name="variant">
				<option value="">Random</option>
				{#each data.cardVariants as variant (variant)}
					<option value={variant}>{CARD_VARIANT_FILTER_LABELS[variant]}</option>
				{/each}
			</select>
		</label>
	</div>

	<button class="btn preset-filled-primary-500 w-full sm:w-auto" type="submit">Roll</button>
</form>

{#if clientError || form?.error}
	<p class="error" role="alert">{clientError || form?.error}</p>
{/if}

<section class="stacked debug-section" aria-labelledby="debug-heading">
	<h2 id="debug-heading" class="h4">Debug: view a specific character</h2>
	<p class="text-sm opacity-75">Pick a character and render every card variant side-by-side.</p>

	<form class="stacked" method="POST" action="?/debug" onsubmit={handleDebugSubmit}>
		<label class="label">
			<span class="label-text">Character:</span>
			<select class="select" name="character" bind:value={selectedCharacter}>
				<option value="">Select a character</option>
				{#each data.characters as character (character.name)}
					<option value={character.name}>{character.name}</option>
				{/each}
			</select>
		</label>

		<button class="btn preset-filled-secondary-500 w-full sm:w-auto" type="submit">
			Show all variants
		</button>
	</form>

	{#if debugError || form?.debugError}
		<p class="error" role="alert">{debugError || form?.debugError}</p>
	{/if}
</section>

<style>
	.debug-section {
		padding-top: var(--stack-gap, 1.5rem);
		border-top: 1px solid var(--color-surface-200);
	}

	@media (prefers-color-scheme: dark) {
		.debug-section {
			border-color: var(--color-surface-800);
		}
	}
</style>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import type { ActionData, PageData } from './$types';
	import { CHAR_ERROR, parseCharFilters, rollCharUrl } from '$lib/genshin';
	import { isElement } from '$lib/types';
	import { CARD_VARIANT_FILTER_LABELS, parseVariantOverride } from '$lib/card-variant';
	import ElementIcon from '$lib/components/ElementIcon.svelte';
	import AnyElementIcon from '$lib/components/AnyElementIcon.svelte';
	import CharacterDebugPanel from '$lib/components/CharacterDebugPanel.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let clientError = $state('');
	let selectedElement = $state('');

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

<CharacterDebugPanel characters={data.characters} error={form?.debugError} />

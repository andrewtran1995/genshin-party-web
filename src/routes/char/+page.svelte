<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import type { ActionData, PageData } from './$types';
	import { CHAR_ERROR, rollCharUrl, parseCharFilters } from '$lib/genshin';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let clientError = $state('');

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		clientError = '';

		const formData = new FormData(event.currentTarget as HTMLFormElement);
		const url = rollCharUrl(parseCharFilters(formData));
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

<form class="stacked" method="POST" onsubmit={handleSubmit}>
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		<label class="label">
			<span class="label-text">Element:</span>
			<select class="select" name="element">
				<option value="">Any</option>
				{#each data.elements as element (element)}
					<option value={element}>{element}</option>
				{/each}
			</select>
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
	</div>

	<button class="btn preset-filled-primary-500 w-full sm:w-auto" type="submit">Roll</button>
</form>

{#if clientError || form?.error}
	<p class="error" role="alert">{clientError || form?.error}</p>
{/if}

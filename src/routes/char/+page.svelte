<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { ActionData, PageData } from './$types';
	import { isElement, isRarity } from '$lib/types';
	import { getRandomChar } from '$lib/genshin';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let clientError = $state('');

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		clientError = '';

		const formData = new FormData(event.currentTarget as HTMLFormElement);
		const elementRaw = formData.get('element');
		const rarityRaw = formData.get('rarity');
		const element = typeof elementRaw === 'string' ? elementRaw : '';
		const rarity = typeof rarityRaw === 'string' ? rarityRaw : '';

		const char = getRandomChar({
			element: isElement(element) ? element : undefined,
			rarity: isRarity(rarity) ? rarity : undefined
		});
		if (!char) {
			clientError = 'No character matches those filters.';
			return;
		}

		const query = [
			element && `element=${encodeURIComponent(element)}`,
			rarity && `rarity=${encodeURIComponent(rarity)}`
		]
			.filter(Boolean)
			.join('&');

		void goto(resolve(`/char/${encodeURIComponent(char.name)}${query ? `?${query}` : ''}`));
	}
</script>

<svelte:head>
	<title>Random character — genshin-party</title>
</svelte:head>

<h1>Random character</h1>

<form class="stacked" method="POST" onsubmit={handleSubmit}>
	<label class="label">
		<span class="label-text">Element:</span>
		<select class="select" name="element">
			<option value="">any</option>
			{#each data.elements as element (element)}
				<option value={element}>{element}</option>
			{/each}
		</select>
	</label>

	<label class="label">
		<span class="label-text">Rarity:</span>
		<select class="select" name="rarity">
			<option value="">any</option>
			{#each data.rarities as rarity (rarity)}
				<option value={rarity}>{rarity}★</option>
			{/each}
		</select>
	</label>

	<button class="btn preset-filled-primary-500" type="submit">Roll</button>
</form>

{#if clientError || form?.error}
	<p class="error" role="alert">{clientError || form?.error}</p>
{/if}

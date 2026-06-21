<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Random character — genshin-party</title>
</svelte:head>

<h1>Random character</h1>

<form method="POST">
	<label>
		Element:
		<select name="element">
			<option value="">any</option>
			{#each data.elements as element (element)}
				<option value={element}>{element}</option>
			{/each}
		</select>
	</label>

	<label>
		Rarity:
		<select name="rarity">
			<option value="">any</option>
			{#each data.rarities as rarity (rarity)}
				<option value={rarity}>{rarity}★</option>
			{/each}
		</select>
	</label>

	<button type="submit">Roll</button>
</form>

{#if form && 'pick' in form}
	<section>
		<h2>{form.pick.name}</h2>
		<p>{form.pick.rarity}★ · {form.pick.elementType}</p>
	</section>
{:else if form && 'error' in form}
	<p role="alert">{form.error}</p>
{/if}

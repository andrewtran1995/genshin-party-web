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

{#if form?.error}
	<p class="error">{form.error}</p>
{:else if form?.char}
	{@const char = form.char}
	<figure class="char">
		{#if char.portrait}
			<img src={char.portrait} alt={char.name} width="240" loading="lazy" />
		{/if}
		<figcaption>
			<strong>{char.name}</strong>
			<span>{char.rarity}★ {char.elementText} · {char.weaponText}</span>
			{#if char.title}<span class="title">{char.title}</span>{/if}
			{#if char.region}<span class="region">{char.region}</span>{/if}
		</figcaption>
	</figure>
{/if}

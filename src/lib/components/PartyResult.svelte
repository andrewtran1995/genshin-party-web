<script lang="ts">
	import CharCard from './CharCard.svelte';
	import { formatPlayer } from '$lib/player-names';
	import type { PlayerChoice } from '$lib/player-selection-stack';

	let { choices, names }: { choices: readonly PlayerChoice[]; names: readonly string[] } = $props();
</script>

<ul class="party-result">
	{#each choices as choice (choice.number)}
		<li>
			<h3>{formatPlayer(choice.number, names)}</h3>
			<CharCard char={choice.char} />
			{#if choice.isMain}
				<p>Main</p>
			{/if}
		</li>
	{/each}
</ul>

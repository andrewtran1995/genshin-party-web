<script lang="ts">
	import CharCard from './CharCard.svelte';
	import { formatPlayer } from '$lib/player-names';
	import type { PlayerChoice } from '$lib/party-flow.svelte';

	let { choices, names }: { choices: readonly PlayerChoice[]; names: readonly string[] } = $props();
</script>

<ul class="party-result">
	{#each choices as choice (choice.number)}
		<li>
			<h3>{formatPlayer(choice.number, names)}</h3>
			<CharCard char={choice.char} />
			{#if choice.isMain}
				<p class="main-tag">Main</p>
			{/if}
		</li>
	{/each}
</ul>

<style>
	.party-result {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(14rem, 100%), 1fr));
		gap: 1.5rem;
		justify-items: center;
	}

	.party-result li {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		max-width: 20rem;
	}

	.party-result h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.main-tag {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: oklch(80% 0.13 86deg);
	}
</style>

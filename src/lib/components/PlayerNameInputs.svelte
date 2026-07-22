<script lang="ts">
	import { tick } from 'svelte';
	import { PARTY_SIZE } from '$lib/party-flow.svelte';

	interface Props {
		players: string[];
		placeholder?: string;
	}

	let {
		// eslint-disable-next-line @typescript-eslint/no-useless-default-assignment
		players = $bindable(),
		placeholder = 'Name'
	}: Props = $props();

	let inputRefs = $state<HTMLInputElement[]>([]);

	export function focusFirst() {
		inputRefs[0]?.focus();
	}

	export function focusLast() {
		inputRefs.at(-1)?.focus();
	}

	async function addPlayer() {
		if (players.length < PARTY_SIZE) {
			players = [...players, ''];
			await tick();
			focusLast();
		}
	}

	async function removePlayer(index: number) {
		if (players.length > 1) {
			const nextIndex = index === 0 ? 0 : index - 1;
			players = players.filter((_, i) => i !== index);
			await tick();
			inputRefs[nextIndex]?.focus();
		}
	}
</script>

<div class="player-inputs">
	{#each players, index (index)}
		<div class="player-input-row">
			<label>
				Player {index + 1}
				<input
					bind:this={inputRefs[index]}
					class="input"
					bind:value={players[index]}
					{placeholder}
					type="text"
				/>
			</label>
			{#if players.length > 1}
				<button
					aria-label={`Remove player ${index + 1}`}
					class="remove-player btn btn-sm preset-tonal-error"
					onclick={() => void removePlayer(index)}
					type="button"
				>
					Remove
				</button>
			{/if}
		</div>
	{/each}
</div>
{#if players.length < PARTY_SIZE}
	<button
		class="add-player btn btn-sm preset-tonal-secondary"
		onclick={() => void addPlayer()}
		type="button"
	>
		Add player
	</button>
{/if}

<style>
	.player-inputs {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 18rem;
		margin-bottom: 0.75rem;
	}

	.player-input-row {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.player-input-row label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.remove-player {
		align-self: flex-end;
		padding-inline: 0.5rem;
	}
</style>

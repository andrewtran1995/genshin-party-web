<script lang="ts">
	import CharCard from '$lib/components/CharCard.svelte';
	import PartyResult from '$lib/components/PartyResult.svelte';
	import { sortBy, prop } from 'remeda';
	import type { Char } from '$lib/types';
	import { expandPlayerNames, formatPlayer } from '$lib/player-names';
	import { getRandomChar } from '$lib/genshin';
	import {
		createPlayerSelectionState,
		getCurrentPlayerNumber,
		transition,
		type PlayerChoice,
		type PlayerSelectionState
	} from '$lib/player-selection-stack';

	let playerNames = $state(['']);
	let expandedNames = $state<string[]>([]);
	let selectionState = $state<PlayerSelectionState | undefined>();
	let currentPlayerNumber = $state<number | undefined>();
	let candidate = $state<Char | undefined>();
	let discardedChoice = $state<PlayerChoice | undefined>();
	let loading = $state(false);
	let error = $state('');

	const isDone = $derived(selectionState?.status === 'done');
	const canGoBack = $derived((selectionState?.playerChoices.length ?? 0) > 0);
	const isFinalPick = $derived((selectionState?.playerChoices.length ?? 0) === 3);
	const finalChoices = $derived(
		selectionState?.status === 'done' ? sortBy(selectionState.playerChoices, prop('number')) : []
	);
	const lastChoice = $derived(selectionState?.playerChoices.at(-1));

	function start() {
		expandedNames = expandPlayerNames(playerNames);
		const initialState = createPlayerSelectionState();
		selectionState = initialState;
		currentPlayerNumber = getCurrentPlayerNumber(initialState);
		fetchCandidate();
	}

	function fetchCandidate() {
		if (!selectionState) return;
		loading = true;
		error = '';

		if (discardedChoice) {
			candidate = discardedChoice.char;
			discardedChoice = undefined;
			loading = false;
			return;
		}

		const { playerChoices } = selectionState;
		const rarity = playerChoices.at(-1)?.isMain ? '4' : '5';
		const exclude = playerChoices.map((choice) => choice.char.name);
		candidate = getRandomChar({ rarity, exclude, includeTraveler: false });
		if (!candidate) {
			error = 'No eligible character.';
		}
		loading = false;
	}

	function accept(isMain: boolean) {
		if (selectionState?.status !== 'active' || !candidate || currentPlayerNumber === undefined)
			return;
		selectionState = transition(selectionState, {
			choice: { char: candidate, isMain, number: currentPlayerNumber },
			type: 'push'
		});
		candidate = undefined;
		if (selectionState.status === 'active') {
			currentPlayerNumber = getCurrentPlayerNumber(selectionState);
			fetchCandidate();
		}
	}

	function acceptNormal() {
		accept(false);
	}

	function acceptAsMain() {
		accept(true);
	}

	function reroll() {
		candidate = undefined;
		fetchCandidate();
	}

	function goBack() {
		if (!selectionState) return;
		const previousChoice = selectionState.playerChoices.at(-1);
		if (!previousChoice) return;
		discardedChoice = previousChoice;
		selectionState = transition(selectionState, { type: 'pop' });
		candidate = undefined;
		if (selectionState.status === 'active') {
			currentPlayerNumber = getCurrentPlayerNumber(selectionState);
			fetchCandidate();
		}
	}

	function reset() {
		selectionState = undefined;
		currentPlayerNumber = undefined;
		candidate = undefined;
		discardedChoice = undefined;
		loading = false;
		error = '';
		playerNames = [''];
		expandedNames = [];
	}

	function addPlayer() {
		if (playerNames.length < 4) {
			playerNames = [...playerNames, ''];
		}
	}

	function removePlayer(index: number) {
		if (playerNames.length > 1) {
			playerNames = playerNames.filter((_, i) => i !== index);
		}
	}
</script>

<svelte:head>
	<title>Interactive party — genshin-party</title>
</svelte:head>

<h1>Interactive party selection</h1>

{#if !selectionState}
	<form
		method="dialog"
		class="player-form control-panel"
		aria-label="Player names"
		onsubmit={(event) => {
			event.preventDefault();
			start();
		}}
	>
		<fieldset>
			<legend>Player names</legend>
			<div class="player-inputs">
				{#each playerNames, index (index)}
					<div class="player-input-row">
						<label class="field">
							<span>Player {index + 1}</span>
							<input bind:value={playerNames[index]} placeholder="Name (optional)" type="text" />
						</label>
						{#if playerNames.length > 1}
							<button
								aria-label={`Remove player ${index + 1}`}
								class="btn btn-ghost remove-player"
								onclick={() => {
									removePlayer(index);
								}}
								type="button"
							>
								Remove
							</button>
						{/if}
					</div>
				{/each}
			</div>
			{#if playerNames.length < 4}
				<button class="btn btn-secondary add-player" onclick={addPlayer} type="button">
					Add player
				</button>
			{/if}
		</fieldset>
		<button class="btn btn-primary btn-wide" type="submit">Start</button>
	</form>
{:else if isDone}
	<h2>Chosen characters</h2>

	<PartyResult choices={finalChoices} names={expandedNames} />

	<button class="btn btn-primary" type="button" onclick={reset}>Start over</button>
{:else}
	{#if currentPlayerNumber !== undefined}
		<p>Now choosing for {formatPlayer(currentPlayerNumber, expandedNames)}.</p>
	{/if}

	{#if loading}
		<p aria-live="polite">Rolling…</p>
	{:else if error}
		<p class="error" role="alert">{error}</p>
	{:else if candidate}
		{#key candidate.id}
			<div class="candidate">
				<CharCard char={candidate} reveal />
			</div>
		{/key}
	{/if}

	<div class="controls">
		<button
			class="btn btn-primary"
			disabled={!candidate || loading}
			onclick={acceptNormal}
			type="button">Accept</button
		>
		<button
			class="btn btn-secondary"
			disabled={!candidate || loading || isFinalPick}
			onclick={acceptAsMain}
			type="button"
		>
			Accept as main
		</button>
		<button class="btn btn-secondary" disabled={loading} onclick={reroll} type="button">
			Reroll
		</button>
		<button class="btn btn-ghost" disabled={!canGoBack || loading} onclick={goBack} type="button">
			{#if lastChoice}
				Go back to {formatPlayer(lastChoice.number, expandedNames)}
			{:else}
				Go back
			{/if}
		</button>
	</div>
{/if}

<style>
	.player-form fieldset {
		border: 0;
		padding: 0;
		margin: 0;
	}

	.player-form legend {
		font-weight: 600;
		margin-bottom: 0.75rem;
		padding: 0;
	}

	.player-inputs {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.player-input-row {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
	}

	.player-input-row .field {
		flex: 1;
	}

	.remove-player {
		flex: none;
		padding-inline: 0.75rem;
	}

	.candidate {
		margin-block: 1.5rem;
	}

	/* Thumb-friendly 2×2 grid on phones; a single inline row once there's room. */
	.controls {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	.controls :global(.btn) {
		width: 100%;
	}

	@media (width >= 34rem) {
		.controls {
			display: flex;
			flex-wrap: wrap;
		}

		.controls :global(.btn) {
			width: auto;
		}
	}
</style>

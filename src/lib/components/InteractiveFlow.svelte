<script lang="ts">
	import { tick } from 'svelte';
	import CharCard from '$lib/components/CharCard.svelte';
	import PartyResult from '$lib/components/PartyResult.svelte';
	import { sortBy, prop } from 'remeda';
	import type { Char } from '$lib/types';
	import { formatPlayer } from '$lib/player-names';
	import type { PlayerSelectionState } from '$lib/player-selection-stack';

	interface Props {
		/** Draft player names, bound so the parent can read them when the flow starts. */
		playerNames?: string[];
		selectionState: PlayerSelectionState | undefined;
		currentPlayerNumber: number | undefined;
		candidate: Char | undefined;
		loading: boolean;
		error: string;
		expandedNames: string[];
		onstart: () => void | Promise<void>;
		onaccept: (isMain: boolean) => void | Promise<void>;
		onreroll: () => void;
		ongoback: () => void | Promise<void>;
		onreset: () => void | Promise<void>;
	}

	let {
		playerNames = $bindable(['']),
		selectionState,
		currentPlayerNumber,
		candidate,
		loading,
		error,
		expandedNames,
		onstart,
		onaccept,
		onreroll,
		ongoback,
		onreset
	}: Props = $props();

	let playerInputRefs = $state<HTMLInputElement[]>([]);
	let acceptButtonRef = $state<HTMLButtonElement | undefined>();
	let startOverButtonRef = $state<HTMLButtonElement | undefined>();

	const isDone = $derived(selectionState?.status === 'done');
	const canGoBack = $derived((selectionState?.playerChoices.length ?? 0) > 0);
	const isFinalPick = $derived((selectionState?.playerChoices.length ?? 0) === 3);
	const finalChoices = $derived(
		selectionState?.status === 'done' ? sortBy(selectionState.playerChoices, prop('number')) : []
	);
	const lastChoice = $derived(selectionState?.playerChoices.at(-1));

	// Focus follows the action: the parent applies the state change, then we wait
	// for the resulting view to render before moving focus into it. Keeping this
	// tied to the handler (rather than a state effect) means a reroll — which
	// swaps the candidate without an intent to move focus — leaves focus put.
	async function start() {
		await onstart();
		await tick();
		acceptButtonRef?.focus();
	}

	async function accept(isMain: boolean) {
		await onaccept(isMain);
		await tick();
		if (isDone) {
			startOverButtonRef?.focus();
		} else {
			acceptButtonRef?.focus();
		}
	}

	function acceptNormal() {
		void accept(false);
	}

	function acceptAsMain() {
		void accept(true);
	}

	function reroll() {
		onreroll();
	}

	async function goBack() {
		await ongoback();
		await tick();
		acceptButtonRef?.focus();
	}

	async function reset() {
		await onreset();
		await tick();
		playerInputRefs[0]?.focus();
	}

	async function addPlayer() {
		if (playerNames.length < 4) {
			playerNames = [...playerNames, ''];
			await tick();
			playerInputRefs.at(-1)?.focus();
		}
	}

	async function removePlayer(index: number) {
		if (playerNames.length > 1) {
			const nextIndex = index === 0 ? 0 : index - 1;
			playerNames = playerNames.filter((_, i) => i !== index);
			await tick();
			playerInputRefs[nextIndex]?.focus();
		}
	}
</script>

{#if !selectionState}
	<form
		class="player-form"
		aria-label="Player names"
		onsubmit={(event) => {
			event.preventDefault();
			void start();
		}}
	>
		<fieldset>
			<legend>Player names</legend>
			<div class="player-inputs">
				{#each playerNames, index (index)}
					<div class="player-input-row">
						<label>
							Player {index + 1}
							<input
								bind:this={playerInputRefs[index]}
								class="input"
								bind:value={playerNames[index]}
								placeholder="Name (optional)"
								type="text"
							/>
						</label>
						{#if playerNames.length > 1}
							<button
								aria-label={`Remove player ${index + 1}`}
								class="remove-player btn btn-sm preset-tonal-error"
								onclick={() => {
									void removePlayer(index);
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
				<button
					class="add-player btn btn-sm preset-tonal-secondary"
					onclick={() => void addPlayer()}
					type="button">Add player</button
				>
			{/if}
		</fieldset>
		<button class="btn preset-filled-primary-500" type="submit">Start</button>
	</form>
{:else if isDone}
	<h2>Chosen characters</h2>
	<p class="visually-hidden" aria-live="polite">Party complete. All characters chosen.</p>

	<PartyResult choices={finalChoices} names={expandedNames} />

	<button
		class="btn preset-tonal-surface"
		type="button"
		bind:this={startOverButtonRef}
		onclick={reset}>Start over</button
	>
{:else}
	{#if currentPlayerNumber !== undefined}
		<p>Now choosing for {formatPlayer(currentPlayerNumber, expandedNames)}.</p>
	{/if}

	{#if loading}
		<p aria-live="polite">Rolling…</p>
	{:else if error}
		<p class="error" role="alert">{error}</p>
	{:else if candidate}
		<p class="visually-hidden" aria-live="polite">Candidate: {candidate.name}</p>
		{#key candidate.id}
			<div class="candidate">
				<CharCard char={candidate} reveal />
			</div>
		{/key}
	{/if}

	<div class="controls">
		<button
			bind:this={acceptButtonRef}
			class="btn preset-filled-primary-500"
			disabled={!candidate || loading}
			onclick={acceptNormal}
			type="button">Accept</button
		>
		<button
			class="btn preset-filled-secondary-500"
			disabled={!candidate || loading || isFinalPick}
			onclick={acceptAsMain}
			type="button"
		>
			Accept as main
		</button>
		<button class="btn preset-tonal-surface" disabled={loading} onclick={reroll} type="button"
			>Reroll</button
		>
		<button
			class="btn preset-tonal-surface"
			disabled={!canGoBack || loading}
			onclick={goBack}
			type="button"
		>
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
		margin: 0 0 1rem;
	}

	.player-form legend {
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.player-inputs {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.player-input-row {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
	}

	.player-input-row label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}

	.remove-player {
		padding-inline: 0.5rem;
	}

	.add-player {
		margin-bottom: 1rem;
	}

	.candidate {
		margin-block: 1rem;
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
</style>

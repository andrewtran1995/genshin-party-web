<script lang="ts">
	import { tick, untrack } from 'svelte';
	import CharCard from '$lib/components/CharCard.svelte';
	import PartyResult from '$lib/components/PartyResult.svelte';
	import PlayerNameInputs from '$lib/components/PlayerNameInputs.svelte';
	import { sortBy, prop } from 'remeda';
	import { formatPlayer } from '$lib/player-names';
	import { PARTY_SIZE, type PartyFlowState } from '$lib/party-flow.svelte';
	import type { Preset } from '$lib/player-presets';

	interface Props {
		flowState: PartyFlowState;
		expandedNames: string[];
		/** Saved parties available to pre-fill the form. */
		presets?: readonly Preset[];
		/** Id of the preset that seeds the form on load, or null for a blank form. */
		defaultPresetId?: string | null;
		/** Receives the draft player names when the flow starts. */
		onstart: (playerNames: string[]) => void;
		onaccept: (isMain: boolean) => void;
		onreroll: () => void;
		onpreviousroll: () => void;
		onnextroll: () => void;
		ongoback: () => void;
		onreset: () => void;
	}

	let {
		flowState,
		expandedNames,
		presets = [],
		defaultPresetId = null,
		onstart,
		onaccept,
		onreroll,
		onpreviousroll,
		onnextroll,
		ongoback,
		onreset
	}: Props = $props();

	// Names for a preset id (or a single blank slot when unmatched/blank). The
	// preset supplies the raw 1..PARTY_SIZE names; expansion happens at start.
	function namesFor(id: string | null): string[] {
		const preset = presets.find((p) => p.id === id);
		return preset?.players.length ? [...preset.players] : [''];
	}

	// The draft names are a self-contained editing concern, owned here as deep
	// reactive state (so per-input bindings stay reactive) and handed to the
	// parent only when the flow starts. On the client they seed from the default
	// preset; editing them never writes back to the saved preset.
	let selectedPresetId = $state<string | null>(untrack(() => defaultPresetId));
	let playerNames = $state(untrack(() => namesFor(defaultPresetId)));

	async function loadPreset(id: string | null) {
		selectedPresetId = id;
		playerNames = namesFor(id);
		await tick();
		playerNameInputs?.focusFirst();
	}
	let playerNameInputs = $state<{ focusFirst(): void; focusLast(): void } | undefined>(undefined);
	let acceptButtonRef = $state<HTMLButtonElement | undefined>();
	let startOverButtonRef = $state<HTMLButtonElement | undefined>();

	const canGoBack = $derived(flowState.playerChoices.length > 0);
	const canGoToPreviousRoll = $derived(flowState.candidateHistoryIndex > 0);
	const canGoToNextRoll = $derived(
		flowState.candidateHistoryIndex < flowState.candidateHistory.length - 1
	);
	const rollIndicator = $derived(
		flowState.candidateHistory.length > 0
			? `Roll ${flowState.candidateHistoryIndex + 1} of ${flowState.candidateHistory.length}`
			: ''
	);
	const isFinalPick = $derived(flowState.playerChoices.length === PARTY_SIZE - 1);
	const finalChoices = $derived(
		flowState.status === 'done' ? sortBy(flowState.playerChoices, prop('number')) : []
	);
	const lastChoice = $derived(flowState.playerChoices.at(-1));

	// Focus follows the action: the parent applies the state change, then we wait
	// for the resulting view to render before moving focus into it. Keeping this
	// tied to the handler (rather than a state effect) means a reroll — which
	// swaps the candidate without an intent to move focus — leaves focus put.
	async function start() {
		onstart(playerNames);
		await tick();
		acceptButtonRef?.focus();
	}

	async function accept(isMain: boolean) {
		onaccept(isMain);
		await tick();
		if (flowState.status === 'done') {
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

	async function previousRoll() {
		onpreviousroll();
		await tick();
		acceptButtonRef?.focus();
	}

	async function nextRoll() {
		onnextroll();
		await tick();
		acceptButtonRef?.focus();
	}

	async function goBack() {
		ongoback();
		await tick();
		acceptButtonRef?.focus();
	}

	async function reset() {
		onreset();
		selectedPresetId = defaultPresetId;
		playerNames = namesFor(defaultPresetId);
		await tick();
		playerNameInputs?.focusFirst();
	}
</script>

{#if flowState.status === 'idle'}
	<form
		class="player-form"
		aria-label="Player names"
		onsubmit={(event) => {
			event.preventDefault();
			void start();
		}}
	>
		{#if presets.length > 0}
			<label class="preset-picker">
				Load a saved party
				<select
					class="select"
					value={selectedPresetId ?? ''}
					onchange={(event) => void loadPreset(event.currentTarget.value || null)}
				>
					<option value="">Start blank</option>
					{#each presets as preset (preset.id)}
						<option value={preset.id}>{preset.name}</option>
					{/each}
				</select>
			</label>
		{/if}
		<fieldset>
			<legend>Player names</legend>
			<PlayerNameInputs
				bind:players={playerNames}
				placeholder="Name (optional)"
				advanceOnEnter
				bind:this={playerNameInputs}
			/>
		</fieldset>
		<button class="btn preset-filled-primary-500" type="submit">Start</button>
	</form>
{:else if flowState.status === 'done'}
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
	{#if flowState.currentPlayerNumber !== undefined}
		<p>Now choosing for {formatPlayer(flowState.currentPlayerNumber, expandedNames)}.</p>
	{/if}

	{#if flowState.error}
		<p class="error" role="alert">{flowState.error}</p>
	{:else if flowState.candidate}
		<p class="visually-hidden" aria-live="polite">Candidate: {flowState.candidate.name}</p>
		{#key flowState.candidate.id}
			<div class="candidate">
				<CharCard char={flowState.candidate} reveal />
			</div>
		{/key}
		{#if rollIndicator}
			<p class="roll-indicator">{rollIndicator}</p>
		{/if}
	{/if}

	<div class="primary-controls">
		<button
			bind:this={acceptButtonRef}
			class="btn preset-filled-primary-500"
			disabled={!flowState.candidate}
			onclick={acceptNormal}
			type="button">Accept</button
		>
		<button
			class="btn preset-filled-secondary-500"
			disabled={!flowState.candidate || isFinalPick}
			onclick={acceptAsMain}
			type="button"
		>
			Accept as main
		</button>
	</div>

	<div class="history-controls" role="group" aria-label="Roll history">
		<button
			class="btn preset-tonal-surface"
			disabled={!canGoToPreviousRoll}
			onclick={previousRoll}
			type="button"
			aria-label="Previous roll">←</button
		>
		<button class="btn preset-tonal-surface" onclick={reroll} type="button">Reroll</button>
		<button
			class="btn preset-tonal-surface"
			disabled={!canGoToNextRoll}
			onclick={nextRoll}
			type="button"
			aria-label="Next roll">→</button
		>
	</div>

	<div class="secondary-controls">
		<button class="btn preset-tonal-surface" disabled={!canGoBack} onclick={goBack} type="button">
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

	.preset-picker {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-bottom: 1rem;
		max-width: 18rem;
		font-weight: 600;
	}

	.candidate {
		margin-block: 1rem;
	}

	.roll-indicator {
		margin-block: 0 1rem;
		font-size: 0.875rem;
		color: var(--color-surface-700);
	}

	.primary-controls,
	.history-controls,
	.secondary-controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.primary-controls {
		margin-block: 0 0.75rem;
	}

	.history-controls {
		gap: 0;
		margin-block: 0 0.5rem;
	}

	.history-controls button {
		border-radius: 0;
	}

	.history-controls button:first-child,
	.history-controls button:last-child {
		min-inline-size: 2.5rem;
		justify-content: center;
	}

	.history-controls button:first-child {
		border-start-start-radius: var(--radius-base);
		border-end-start-radius: var(--radius-base);
	}

	.history-controls button:last-child {
		border-start-end-radius: var(--radius-base);
		border-end-end-radius: var(--radius-base);
	}

	.history-controls button:not(:first-child) {
		margin-inline-start: -1px;
	}

	.secondary-controls {
		margin-block-start: 0.25rem;
	}
</style>

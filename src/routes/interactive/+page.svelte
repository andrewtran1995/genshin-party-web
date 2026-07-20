<script lang="ts">
	import InteractiveFlow from '$lib/components/InteractiveFlow.svelte';
	import type { Char } from '$lib/types';
	import { expandPlayerNames } from '$lib/player-names';
	import { getRandomChar } from '$lib/genshin';
	import {
		createPlayerSelectionState,
		getCurrentPlayerNumber,
		transition,
		type PlayerChoice,
		type PlayerSelectionState
	} from '$lib/player-selection-stack';

	let expandedNames = $state<string[]>([]);
	let selectionState = $state<PlayerSelectionState | undefined>();
	let currentPlayerNumber = $state<number | undefined>();
	let candidate = $state<Char | undefined>();
	let discardedChoice = $state<PlayerChoice | undefined>();
	let loading = $state(false);
	let error = $state('');

	function start(playerNames: string[]) {
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

		if (selectionState.status !== 'done') {
			currentPlayerNumber = getCurrentPlayerNumber(selectionState);
			fetchCandidate();
		}
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
		expandedNames = [];
	}
</script>

<svelte:head>
	<title>Interactive party — genshin-party</title>
</svelte:head>

<h1>Interactive party selection</h1>

<InteractiveFlow
	{selectionState}
	{currentPlayerNumber}
	{candidate}
	{loading}
	{error}
	{expandedNames}
	onstart={start}
	onaccept={accept}
	onreroll={reroll}
	ongoback={goBack}
	onreset={reset}
/>

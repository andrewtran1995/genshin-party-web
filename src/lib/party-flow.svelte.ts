import { shuffle } from 'remeda';
import { getRandomChar } from '$lib/genshin';
import type { Char } from '$lib/types';

/** Fixed team size. The web UI always fills exactly this many slots. */
export const PARTY_SIZE = 4;

export interface PlayerChoice {
	readonly char: Char;
	readonly isMain: boolean;
	readonly number: number;
}

export interface PartyFlowState {
	readonly status: 'idle' | 'active' | 'done';
	readonly playerChoices: readonly PlayerChoice[];
	readonly playerOrder: readonly number[];
	readonly currentPlayerNumber: number | undefined;
	readonly candidate: Char | undefined;
	readonly candidateHistory: readonly Char[];
	readonly candidateHistoryIndex: number;
	readonly error: string;
}

/**
 * Owns the interactive party-selection flow: whose turn it is, what
 * candidate they're offered, and the rarity/exclusion/re-offer rules that
 * govern rolling. `main -> next candidate is 4-star`, `go back re-offers
 * the same character`, and per-turn roll history live here because they
 * constrain this stack directly.
 */
export function createPartyFlow() {
	let status = $state<PartyFlowState['status']>('idle');
	let playerChoices = $state<PlayerChoice[]>([]);
	let playerOrder = $state<number[]>([]);
	let candidateHistory = $state<Char[]>([]);
	let candidateHistoryIndex = $state(-1);
	let error = $state('');

	const candidate = $derived(
		candidateHistoryIndex >= 0 ? candidateHistory[candidateHistoryIndex] : undefined
	);

	const currentPlayerNumber = $derived(
		status === 'active' ? playerOrder[playerChoices.length] : undefined
	);

	function rollNext() {
		if (status !== 'active' || currentPlayerNumber === undefined) return;
		const rarity = playerChoices.at(-1)?.isMain ? '4' : '5';
		const exclude = [
			...playerChoices.map((choice) => choice.char.name),
			...candidateHistory.map((char) => char.name)
		];
		const rolled = getRandomChar({ rarity, exclude, includeTraveler: false });
		if (rolled) {
			candidateHistory = [...candidateHistory.slice(0, candidateHistoryIndex + 1), rolled];
			candidateHistoryIndex = candidateHistory.length - 1;
			error = '';
		} else {
			error = 'No eligible character.';
		}
	}

	function roll() {
		if (status !== 'active' || candidateHistoryIndex < 0) return;
		rollNext();
	}

	function previousRoll() {
		if (candidateHistoryIndex > 0) {
			candidateHistoryIndex -= 1;
		}
	}

	function nextRoll() {
		if (candidateHistoryIndex < candidateHistory.length - 1) {
			candidateHistoryIndex += 1;
		}
	}

	function accept(isMain: boolean) {
		if (status !== 'active' || candidate === undefined || currentPlayerNumber === undefined) return;
		playerChoices = [...playerChoices, { char: candidate, isMain, number: currentPlayerNumber }];
		candidateHistory = [];
		candidateHistoryIndex = -1;
		if (playerChoices.length === PARTY_SIZE) {
			status = 'done';
		} else {
			rollNext();
		}
	}

	function goBack() {
		const previous = playerChoices.at(-1);
		if (!previous) return;
		playerChoices = playerChoices.slice(0, -1);
		status = 'active';
		error = '';
		candidateHistory = [previous.char];
		candidateHistoryIndex = 0;
	}

	function start() {
		status = 'active';
		playerChoices = [];
		playerOrder = shuffle([1, 2, 3, 4]);
		candidateHistory = [];
		candidateHistoryIndex = -1;
		error = '';
		rollNext();
	}

	function reset() {
		status = 'idle';
		playerChoices = [];
		playerOrder = [];
		candidateHistory = [];
		candidateHistoryIndex = -1;
		error = '';
	}

	return {
		get state(): PartyFlowState {
			return {
				status,
				playerChoices,
				playerOrder,
				currentPlayerNumber,
				candidate,
				candidateHistory,
				candidateHistoryIndex,
				error
			};
		},
		roll,
		previousRoll,
		nextRoll,
		accept,
		goBack,
		start,
		reset
	};
}

export type PartyFlow = ReturnType<typeof createPartyFlow>;

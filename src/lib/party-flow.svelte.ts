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
	readonly error: string;
}

/**
 * Owns the interactive party-selection flow: whose turn it is, what
 * candidate they're offered, and the rarity/exclusion/re-offer rules that
 * govern rolling. `main -> next candidate is 4-star` and `go back re-offers
 * the same character` live here because they constrain this stack directly.
 */
export function createPartyFlow() {
	let status = $state<PartyFlowState['status']>('idle');
	let playerChoices = $state<PlayerChoice[]>([]);
	let playerOrder = $state<number[]>([]);
	let candidate = $state<Char | undefined>();
	let error = $state('');

	const currentPlayerNumber = $derived(
		status === 'active' ? playerOrder[playerChoices.length] : undefined
	);

	function rollNext(alsoExclude: string[] = []) {
		const rarity = playerChoices.at(-1)?.isMain ? '4' : '5';
		const exclude = [...playerChoices.map((choice) => choice.char.name), ...alsoExclude];
		candidate = getRandomChar({ rarity, exclude, includeTraveler: false });
		error = candidate ? '' : 'No eligible character.';
	}

	function roll() {
		if (status !== 'active') return;
		const excludeCurrent = candidate?.name;
		candidate = undefined;
		rollNext(excludeCurrent ? [excludeCurrent] : []);
	}

	function accept(isMain: boolean) {
		if (status !== 'active' || !candidate || currentPlayerNumber === undefined) return;
		playerChoices = [...playerChoices, { char: candidate, isMain, number: currentPlayerNumber }];
		candidate = undefined;
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
		candidate = previous.char;
	}

	function start() {
		status = 'active';
		playerChoices = [];
		playerOrder = shuffle([1, 2, 3, 4]);
		candidate = undefined;
		rollNext();
	}

	function reset() {
		status = 'idle';
		playerChoices = [];
		playerOrder = [];
		candidate = undefined;
		error = '';
	}

	return {
		get state(): PartyFlowState {
			return { status, playerChoices, playerOrder, currentPlayerNumber, candidate, error };
		},
		roll,
		accept,
		goBack,
		start,
		reset
	};
}

export type PartyFlow = ReturnType<typeof createPartyFlow>;

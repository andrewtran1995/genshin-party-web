import { shuffle } from 'remeda';
import { match } from 'ts-pattern';
import type { Char } from '$lib/types';

export interface PlayerChoice {
	char: Char;
	isMain: boolean;
	number: number;
}

export interface PlayerSelectionStateActive {
	readonly status: 'active';
	readonly playerChoices: readonly PlayerChoice[];
	readonly playerOrder: readonly number[];
}

export interface PlayerSelectionStateDone {
	readonly status: 'done';
	readonly playerChoices: readonly PlayerChoice[];
	readonly playerOrder: readonly number[];
}

export type PlayerSelectionState = PlayerSelectionStateActive | PlayerSelectionStateDone;

export type PlayerSelectionEvent =
	| { readonly type: 'push'; readonly choice: PlayerChoice }
	| { readonly type: 'pop' };

export interface CreatePlayerSelectionStateInput {
	readonly playerOrder?: readonly number[];
}

export const createPlayerSelectionState = (
	input: CreatePlayerSelectionStateInput = {}
): PlayerSelectionStateActive => ({
	status: 'active',
	playerChoices: [],
	playerOrder: input.playerOrder ?? shuffle([1, 2, 3, 4])
});

export const getCurrentPlayerNumber = (state: PlayerSelectionState): number => {
	const playerNumber = state.playerOrder[state.playerChoices.length];
	if (playerNumber === undefined) {
		throw new Error('Player order exhausted');
	}
	return playerNumber;
};

export const transition = (
	state: PlayerSelectionState,
	event: PlayerSelectionEvent
): PlayerSelectionState =>
	match(event)
		.with({ type: 'push' }, ({ choice }) => {
			const playerChoices = [...state.playerChoices, choice];
			return playerChoices.length === 4
				? { ...state, playerChoices, status: 'done' as const }
				: { ...state, playerChoices, status: 'active' as const };
		})
		.with({ type: 'pop' }, () => {
			if (state.playerChoices.length === 0) return state;
			const playerChoices = state.playerChoices.slice(0, -1);
			return { ...state, playerChoices, status: 'active' as const };
		})
		.exhaustive();

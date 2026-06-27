import { assign, createActor, setup } from 'xstate';
import type { Char } from '$lib/types';

export interface PlayerChoice {
	char: Char;
	isMain: boolean;
	number: number;
}

const getCurrentPlayerNumber = (order: number[], choices: PlayerChoice[]): number => {
	const playerNumber = order[choices.length];
	if (playerNumber === undefined) {
		throw new Error('Player order exhausted');
	}
	return playerNumber;
};

const swap = (array: unknown[], i: number, j: number): void => {
	const a = array[i];
	const b = array[j];
	if (a === undefined || b === undefined) return;
	array[i] = b;
	array[j] = a;
};

/** Fisher-Yates shuffle, returning a new array. */
const shuffle = <T>(items: readonly T[]): T[] => {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		swap(result, i, j);
	}
	return result;
};

export const playerSelectionStack = setup({
	actions: {
		pop: assign({
			playerChoices: ({ context }) => context.playerChoices.slice(0, -1)
		}),
		push: assign({
			playerChoices: ({ context }, choice: PlayerChoice) => [...context.playerChoices, choice]
		})
	},
	guards: {
		isFull: ({ context }) => context.playerChoices.length === 4
	},
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
	types: {} as {
		context: {
			onNewChoiceFunction: ((playerNumber: number) => void) | undefined;
			playerChoices: PlayerChoice[];
			playerOrder: number[];
		};
		events: { type: 'push'; choice: PlayerChoice } | { type: 'pop' };
		input: { onNewChoiceFunction?: (playerNumber: number) => void };
	}
}).createMachine({
	context: ({ input }) => ({
		onNewChoiceFunction: input.onNewChoiceFunction,
		playerChoices: [],
		playerOrder: shuffle([1, 2, 3, 4])
	}),
	initial: 'ready',
	states: {
		checkIfDone: {
			always: [{ guard: 'isFull', target: 'done' }, { target: 'ready' }]
		},
		done: {
			type: 'final'
		},
		ready: {
			entry: [
				({ context }) => {
					context.onNewChoiceFunction?.(
						getCurrentPlayerNumber(context.playerOrder, context.playerChoices)
					);
				}
			],
			on: {
				pop: { actions: 'pop', target: 'checkIfDone' },
				push: {
					actions: { params: ({ event }) => event.choice, type: 'push' },
					target: 'checkIfDone'
				}
			}
		}
	}
});

export const createPlayerSelectionStackActor = (
	options: Parameters<typeof createActor<typeof playerSelectionStack>>[1]
) => createActor(playerSelectionStack, options);

import { range, shuffle, take } from 'remeda';
import { assign, createActor, setup } from 'xstate';
import type { PlayerChoice } from './types';

export const playerSelectionStack = setup({
	actions: {
		pop: assign({
			playerChoices: ({ context }) => take(context.playerChoices, context.playerChoices.length - 1)
		}),
		push: assign({
			playerChoices: ({ context }, choice: PlayerChoice) => [...context.playerChoices, choice]
		})
	},
	guards: {
		isFull: ({ context }) => context.playerChoices.length === 4
	},
	types: {
		context: {} as {
			playerChoices: PlayerChoice[];
			playerOrder: number[];
		},
		events: {} as { type: 'push'; choice: PlayerChoice } | { type: 'pop' }
	}
}).createMachine({
	context: () => ({
		playerChoices: [],
		playerOrder: shuffle(range(1, 5))
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
			on: {
				pop: {
					actions: { type: 'pop' },
					target: 'checkIfDone'
				},
				push: {
					actions: { params: ({ event }) => event.choice, type: 'push' },
					target: 'checkIfDone'
				}
			}
		}
	}
});

export const createPlayerSelectionStackActor = () => createActor(playerSelectionStack);

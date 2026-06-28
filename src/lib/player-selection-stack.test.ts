import { describe, expect, it } from 'vitest';
import {
	createPlayerSelectionState,
	getCurrentPlayerNumber,
	transition,
	type PlayerSelectionState
} from './player-selection-stack';

const makeChar = (name: string, rarity: 4 | 5 = 5): import('$lib/types').Char => ({
	id: 1,
	name,
	title: '',
	rarity,
	element: 'pyro',
	elementText: 'Pyro',
	weaponText: 'Sword',
	region: 'Mondstadt',
	portrait: undefined,
	icon: undefined,
	fandomUrl: undefined
});

describe('playerSelectionStack', () => {
	it('starts with empty choices and a shuffled player order', () => {
		const state = createPlayerSelectionState();

		expect(state.playerChoices).toEqual([]);
		expect(state.playerOrder).toHaveLength(4);
		expect(new Set(state.playerOrder)).toEqual(new Set([1, 2, 3, 4]));
		expect(state.status).toBe('active');
	});

	it('exposes the first player number', () => {
		const state = createPlayerSelectionState({ playerOrder: [1, 2, 3, 4] });

		expect(getCurrentPlayerNumber(state)).toBe(1);
	});

	it('pushes a choice and advances to the next slot', () => {
		let state: PlayerSelectionState = createPlayerSelectionState({ playerOrder: [1, 2, 3, 4] });

		state = transition(state, {
			choice: { char: makeChar('Amber'), isMain: false, number: 1 },
			type: 'push'
		});

		expect(state.playerChoices).toHaveLength(1);
		expect(state.playerChoices[0]?.char.name).toBe('Amber');
		expect(state.status).toBe('active');
		expect(getCurrentPlayerNumber(state)).toBe(2);
	});

	it('enters done after four pushes', () => {
		let state: PlayerSelectionState = createPlayerSelectionState({ playerOrder: [1, 2, 3, 4] });

		for (let i = 0; i < 4; i++) {
			state = transition(state, {
				choice: { char: makeChar(`Char${i}`), isMain: false, number: i + 1 },
				type: 'push'
			});
		}

		expect(state.status).toBe('done');
		expect(state.playerChoices).toHaveLength(4);
	});

	it('pops the last choice and returns to the previous slot', () => {
		let state: PlayerSelectionState = createPlayerSelectionState({ playerOrder: [1, 2, 3, 4] });

		state = transition(state, {
			choice: { char: makeChar('Amber'), isMain: false, number: 1 },
			type: 'push'
		});
		state = transition(state, {
			choice: { char: makeChar('Barbara'), isMain: false, number: 2 },
			type: 'push'
		});
		state = transition(state, { type: 'pop' });

		expect(state.playerChoices).toHaveLength(1);
		expect(state.playerChoices[0]?.char.name).toBe('Amber');
		expect(getCurrentPlayerNumber(state)).toBe(2);
	});

	it('ignores pop when empty', () => {
		const state = createPlayerSelectionState({ playerOrder: [1, 2, 3, 4] });
		const next = transition(state, { type: 'pop' });

		expect(next.playerChoices).toHaveLength(0);
		expect(next.status).toBe('active');
	});
});

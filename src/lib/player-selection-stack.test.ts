import { describe, expect, it, vi } from 'vitest';
import { createPlayerSelectionStackActor, playerSelectionStack } from './player-selection-stack';

const makeChar = (name: string, rarity: 4 | 5 = 5): import('$lib/types').Char => ({
	id: 1,
	name,
	title: '',
	rarity,
	element: 'pyro',
	elementText: 'Pyro',
	weaponText: 'Sword',
	region: 'Mondstadt',
	portrait: null,
	icon: null,
	fandomUrl: null
});

const assertDefined = <T>(value: T | undefined): T => {
	if (value === undefined) {
		throw new Error('Expected a defined value');
	}
	return value;
};

describe('playerSelectionStack', () => {
	it('starts with empty choices and a shuffled player order', () => {
		const actor = createPlayerSelectionStackActor({ input: {} }).start();
		const snapshot = actor.getSnapshot();

		expect(snapshot.context.playerChoices).toEqual([]);
		expect(snapshot.context.playerOrder).toHaveLength(4);
		expect(new Set(snapshot.context.playerOrder)).toEqual(new Set([1, 2, 3, 4]));
		expect(snapshot.status).toBe('active');
		actor.stop();
	});

	it('calls onNewChoiceFunction with the first player number on start', () => {
		const onNewChoiceFunction = vi.fn();
		const actor = createPlayerSelectionStackActor({
			input: { onNewChoiceFunction }
		}).start();

		const firstPlayer = actor.getSnapshot().context.playerOrder[0];
		expect(onNewChoiceFunction).toHaveBeenCalledExactlyOnceWith(firstPlayer);
		actor.stop();
	});

	it('pushes a choice and advances to the next slot', () => {
		const onNewChoiceFunction = vi.fn();
		const actor = createPlayerSelectionStackActor({
			input: { onNewChoiceFunction }
		}).start();
		const firstPlayer = assertDefined(actor.getSnapshot().context.playerOrder[0]);

		actor.send({
			choice: { char: makeChar('Amber'), isMain: false, number: firstPlayer },
			type: 'push'
		});

		const snapshot = actor.getSnapshot();
		expect(snapshot.context.playerChoices).toHaveLength(1);
		expect(snapshot.context.playerChoices[0]?.char.name).toBe('Amber');
		expect(onNewChoiceFunction).toHaveBeenCalledTimes(2);
		expect(onNewChoiceFunction).toHaveBeenLastCalledWith(snapshot.context.playerOrder[1]);
		actor.stop();
	});

	it('enters done after four pushes', () => {
		const actor = createPlayerSelectionStackActor({ input: {} }).start();
		const { playerOrder } = actor.getSnapshot().context;

		for (let i = 0; i < 4; i++) {
			actor.send({
				choice: {
					char: makeChar(`Char${i}`),
					isMain: false,
					number: assertDefined(playerOrder[i])
				},
				type: 'push'
			});
		}

		const snapshot = actor.getSnapshot();
		expect(snapshot.status).toBe('done');
		expect(snapshot.context.playerChoices).toHaveLength(4);
		actor.stop();
	});

	it('pops the last choice and returns to the previous slot', () => {
		const onNewChoiceFunction = vi.fn();
		const actor = createPlayerSelectionStackActor({
			input: { onNewChoiceFunction }
		}).start();
		const { playerOrder } = actor.getSnapshot().context;

		actor.send({
			choice: { char: makeChar('Amber'), isMain: false, number: assertDefined(playerOrder[0]) },
			type: 'push'
		});
		actor.send({
			choice: {
				char: makeChar('Barbara'),
				isMain: false,
				number: assertDefined(playerOrder[1])
			},
			type: 'push'
		});
		onNewChoiceFunction.mockClear();

		actor.send({ type: 'pop' });

		const snapshot = actor.getSnapshot();
		expect(snapshot.context.playerChoices).toHaveLength(1);
		expect(snapshot.context.playerChoices[0]?.char.name).toBe('Amber');
		expect(onNewChoiceFunction).toHaveBeenCalledExactlyOnceWith(playerOrder[1]);
		actor.stop();
	});

	it('exports the raw machine for type-level reuse', () => {
		expect(playerSelectionStack).toBeDefined();
	});
});

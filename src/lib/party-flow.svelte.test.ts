import { describe, expect, it } from 'vitest';
import { createPartyFlow, PARTY_SIZE } from './party-flow.svelte';

describe('createPartyFlow', () => {
	it('starts idle with no candidate', () => {
		const flow = createPartyFlow();

		expect(flow.state).toEqual({
			status: 'idle',
			playerChoices: [],
			playerOrder: [],
			currentPlayerNumber: undefined,
			candidate: undefined,
			candidateHistory: [],
			candidateHistoryIndex: -1,
			error: ''
		});
	});

	it('start rolls a candidate for a freshly shuffled player order', () => {
		const flow = createPartyFlow();
		flow.start();

		expect(flow.state.status).toBe('active');
		expect(flow.state.playerOrder).toHaveLength(PARTY_SIZE);
		expect(new Set(flow.state.playerOrder)).toEqual(new Set([1, 2, 3, 4]));
		expect(flow.state.currentPlayerNumber).toBe(flow.state.playerOrder[0]);
		expect(flow.state.candidate).toBeDefined();
	});

	it('accept pushes the choice and advances to the next slot', () => {
		const flow = createPartyFlow();
		flow.start();
		const candidate = flow.state.candidate;
		const player = flow.state.currentPlayerNumber;

		flow.accept(false);

		expect(flow.state.playerChoices).toEqual([{ char: candidate, isMain: false, number: player }]);
		expect(flow.state.status).toBe('active');
		expect(flow.state.currentPlayerNumber).toBe(flow.state.playerOrder[1]);
		expect(flow.state.candidate).toBeDefined();
	});

	it('enters done after four accepts', () => {
		const flow = createPartyFlow();
		flow.start();

		for (let i = 0; i < PARTY_SIZE; i++) {
			flow.accept(false);
		}

		expect(flow.state.status).toBe('done');
		expect(flow.state.playerChoices).toHaveLength(PARTY_SIZE);
		expect(flow.state.currentPlayerNumber).toBeUndefined();
	});

	it('offers a 4-star candidate immediately after a main pick', () => {
		const flow = createPartyFlow();
		flow.start();

		flow.accept(true);

		expect(flow.state.candidate?.rarity).toBe(4);
	});

	it('offers a 5-star candidate after a non-main pick', () => {
		const flow = createPartyFlow();
		flow.start();

		flow.accept(false);

		expect(flow.state.candidate?.rarity).toBe(5);
	});

	it('never offers an already-chosen character', () => {
		const flow = createPartyFlow();
		flow.start();

		for (let i = 0; i < PARTY_SIZE; i++) {
			const chosenNames = flow.state.playerChoices.map((choice) => choice.char.name);
			expect(chosenNames).not.toContain(flow.state.candidate?.name);
			flow.accept(false);
		}
	});

	it('roll never re-offers the current candidate', () => {
		const flow = createPartyFlow();
		flow.start();
		const before = flow.state.candidate?.name;

		flow.roll();

		expect(flow.state.candidate?.name).not.toBe(before);
	});

	it('roll does nothing when idle', () => {
		const flow = createPartyFlow();

		flow.roll();

		expect(flow.state.status).toBe('idle');
		expect(flow.state.candidate).toBeUndefined();
	});

	it('goBack re-offers the popped character instead of rolling a new one', () => {
		const flow = createPartyFlow();
		flow.start();
		const offered = flow.state.candidate;

		flow.accept(false);
		expect(flow.state.playerChoices).toHaveLength(1);

		flow.goBack();

		expect(flow.state.playerChoices).toHaveLength(0);
		expect(flow.state.status).toBe('active');
		expect(flow.state.candidate).toEqual(offered);
		expect(flow.state.candidateHistory).toEqual([offered]);
		expect(flow.state.candidateHistoryIndex).toBe(0);
		expect(flow.state.currentPlayerNumber).toBe(flow.state.playerOrder[0]);
	});

	it('clears the roll history when accepting a candidate', () => {
		const flow = createPartyFlow();
		flow.start();
		flow.roll();
		expect(flow.state.candidateHistory.length).toBeGreaterThan(1);

		flow.accept(false);

		expect(flow.state.candidateHistory).toEqual([flow.state.candidate]);
		expect(flow.state.candidateHistoryIndex).toBe(0);
	});

	it('previousRoll and nextRoll navigate the turn history', () => {
		const flow = createPartyFlow();
		flow.start();
		const first = flow.state.candidate;
		flow.roll();
		const second = flow.state.candidate;
		flow.roll();
		const third = flow.state.candidate;

		expect(flow.state.candidateHistory).toEqual([first, second, third]);
		expect(flow.state.candidateHistoryIndex).toBe(2);

		flow.previousRoll();
		expect(flow.state.candidate).toEqual(second);
		expect(flow.state.candidateHistoryIndex).toBe(1);

		flow.previousRoll();
		expect(flow.state.candidate).toEqual(first);
		expect(flow.state.candidateHistoryIndex).toBe(0);

		flow.previousRoll();
		expect(flow.state.candidate).toEqual(first);
		expect(flow.state.candidateHistoryIndex).toBe(0);

		flow.nextRoll();
		expect(flow.state.candidate).toEqual(second);
		expect(flow.state.candidateHistoryIndex).toBe(1);

		flow.nextRoll();
		flow.nextRoll();
		expect(flow.state.candidate).toEqual(third);
		expect(flow.state.candidateHistoryIndex).toBe(2);
	});

	it('rolling from the middle of history truncates the forward history', () => {
		const flow = createPartyFlow();
		flow.start();
		const first = flow.state.candidate;
		flow.roll();
		const second = flow.state.candidate;
		flow.roll();
		const third = flow.state.candidate;
		expect(flow.state.candidateHistory).toEqual([first, second, third]);

		flow.previousRoll();
		expect(flow.state.candidate).toEqual(second);

		flow.roll();
		const replacement = flow.state.candidate;

		expect(flow.state.candidateHistory).toEqual([first, second, replacement]);
		expect(flow.state.candidateHistoryIndex).toBe(2);
	});

	it('rerolling excludes every candidate that appeared this turn', () => {
		const flow = createPartyFlow();
		flow.start();
		const historyNames = new Set<string>();
		for (let i = 0; i < 5; i++) {
			const name = flow.state.candidate?.name;
			if (name) historyNames.add(name);
			flow.roll();
		}
		expect(historyNames.size).toBe(5);
	});

	it('goBack clears the current turn history and seeds it with the re-offered character', () => {
		const flow = createPartyFlow();
		flow.start();
		flow.roll();
		flow.roll();
		flow.accept(false);
		flow.roll();
		flow.roll();

		const reoffered = flow.state.playerChoices.at(-1)?.char;
		flow.goBack();

		expect(flow.state.candidateHistory).toEqual([reoffered]);
		expect(flow.state.candidateHistoryIndex).toBe(0);
	});

	it('goBack does nothing before any choice has been made', () => {
		const flow = createPartyFlow();
		flow.start();
		const candidate = flow.state.candidate;
		const history = flow.state.candidateHistory;
		const historyIndex = flow.state.candidateHistoryIndex;

		flow.goBack();

		expect(flow.state.candidate).toEqual(candidate);
		expect(flow.state.candidateHistory).toEqual(history);
		expect(flow.state.candidateHistoryIndex).toBe(historyIndex);
		expect(flow.state.playerChoices).toEqual([]);
	});

	it('reset returns to idle', () => {
		const flow = createPartyFlow();
		flow.start();
		flow.accept(false);

		flow.reset();

		expect(flow.state).toEqual({
			status: 'idle',
			playerChoices: [],
			playerOrder: [],
			currentPlayerNumber: undefined,
			candidate: undefined,
			candidateHistory: [],
			candidateHistoryIndex: -1,
			error: ''
		});
	});
});

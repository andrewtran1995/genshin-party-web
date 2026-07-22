import { describe, expect, it } from 'vitest';
import {
	addPreset,
	deletePreset,
	emptyStore,
	getDefaultPreset,
	makePreset,
	normalizePlayers,
	parseStore,
	serializeStore,
	setDefaultPreset,
	updatePreset,
	validatePresetInput,
	type PresetStore
} from './player-presets';

// Narrow away `undefined` from indexed access under noUncheckedIndexedAccess.
const req = <T>(value: T | null | undefined): T => {
	if (value == null) throw new Error('expected a value');
	return value;
};

const storeWith = (...names: string[][]): { store: PresetStore; ids: string[] } => {
	let store = emptyStore();
	const ids: string[] = [];
	for (const players of names) {
		const preset = makePreset(`P${ids.length}`, players);
		store = addPreset(store, preset);
		ids.push(preset.id);
	}
	return { store, ids };
};

describe('normalizePlayers', () => {
	it('trims, drops blanks, and caps at four', () => {
		expect(normalizePlayers([' A ', '', '  ', 'B', 'C', 'D', 'E'])).toEqual(['A', 'B', 'C', 'D']);
	});
});

describe('validatePresetInput', () => {
	it('requires a name', () => {
		expect(validatePresetInput('   ', ['A'])).toMatch(/name/i);
	});

	it('requires at least one non-blank player', () => {
		expect(validatePresetInput('Crew', ['   ', ''])).toMatch(/player/i);
	});

	it('accepts a named preset with one player', () => {
		expect(validatePresetInput('Crew', ['A'])).toBeNull();
	});
});

describe('makePreset', () => {
	it('normalizes players and assigns a unique id', () => {
		const a = makePreset('  Crew  ', [' A ', '']);
		const b = makePreset('Crew', ['A']);
		expect(a.name).toBe('Crew');
		expect(a.players).toEqual(['A']);
		expect(a.id).not.toBe(b.id);
	});
});

describe('CRUD reducers', () => {
	it('adds presets immutably', () => {
		const before = emptyStore();
		const after = addPreset(before, makePreset('Crew', ['A']));
		expect(before.presets).toHaveLength(0);
		expect(after.presets).toHaveLength(1);
	});

	it('updates name and players by id, leaving others untouched', () => {
		const { store, ids } = storeWith(['A'], ['B']);
		const next = updatePreset(store, req(ids[0]), { name: ' New ', players: ['X', 'Y'] });
		expect(next.presets[0]).toMatchObject({ name: 'New', players: ['X', 'Y'] });
		expect(req(next.presets[1]).name).toBe('P1');
	});

	it('deletes by id and clears the default when it was the deleted one', () => {
		const { store, ids } = storeWith(['A'], ['B']);
		const withDefault = setDefaultPreset(store, req(ids[0]));
		const next = deletePreset(withDefault, req(ids[0]));
		expect(next.presets.map((p) => p.id)).toEqual([ids[1]]);
		expect(next.defaultId).toBeNull();
	});

	it('keeps the default when a different preset is deleted', () => {
		const { store, ids } = storeWith(['A'], ['B']);
		const withDefault = setDefaultPreset(store, req(ids[1]));
		const next = deletePreset(withDefault, req(ids[0]));
		expect(next.defaultId).toBe(ids[1]);
	});

	it('ignores an unknown id when setting the default', () => {
		const { store } = storeWith(['A']);
		expect(setDefaultPreset(store, 'nope').defaultId).toBeNull();
	});

	it('clears the default with null', () => {
		const { store, ids } = storeWith(['A']);
		const withDefault = setDefaultPreset(store, req(ids[0]));
		expect(setDefaultPreset(withDefault, null).defaultId).toBeNull();
	});

	it('resolves the default preset object', () => {
		const { store, ids } = storeWith(['A'], ['B']);
		const withDefault = setDefaultPreset(store, req(ids[1]));
		expect(getDefaultPreset(withDefault)?.id).toBe(ids[1]);
		expect(getDefaultPreset(store)).toBeUndefined();
	});
});

describe('parseStore', () => {
	it('reads an empty store from null/empty input', () => {
		expect(parseStore(null)).toEqual(emptyStore());
		expect(parseStore('')).toEqual(emptyStore());
	});

	it('round-trips a serialized store', () => {
		const { store, ids } = storeWith(['A', 'B']);
		const withDefault = setDefaultPreset(store, req(ids[0]));
		expect(parseStore(serializeStore(withDefault))).toEqual(withDefault);
	});

	it('returns empty for invalid JSON', () => {
		expect(parseStore('{not json')).toEqual(emptyStore());
	});

	it('drops malformed entries but keeps valid ones', () => {
		const raw = JSON.stringify({
			presets: [
				{ id: 'a', name: 'Good', players: ['X'] },
				{ id: 'b', name: '', players: ['Y'] }, // blank name
				{ id: 'c', name: 'NoPlayers', players: [] }, // empty players
				{ name: 'NoId', players: ['Z'] }, // missing id
				'garbage'
			],
			defaultId: 'a'
		});
		const parsed = parseStore(raw);
		expect(parsed.presets.map((p) => p.id)).toEqual(['a']);
		expect(parsed.defaultId).toBe('a');
	});

	it('de-duplicates repeated ids', () => {
		const raw = JSON.stringify({
			presets: [
				{ id: 'a', name: 'First', players: ['X'] },
				{ id: 'a', name: 'Dupe', players: ['Y'] }
			],
			defaultId: null
		});
		expect(parseStore(raw).presets).toHaveLength(1);
		expect(req(parseStore(raw).presets[0]).name).toBe('First');
	});

	it('drops a default id that no longer resolves', () => {
		const raw = JSON.stringify({
			presets: [{ id: 'a', name: 'Good', players: ['X'] }],
			defaultId: 'missing'
		});
		expect(parseStore(raw).defaultId).toBeNull();
	});
});

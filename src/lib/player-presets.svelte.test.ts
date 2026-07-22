import { beforeEach, describe, expect, it, vi } from 'vitest';

// Force the browser guards on so load/persist actually touch localStorage.
vi.mock('$app/environment', () => ({ browser: true }));

import { createPresetStore, STORAGE_KEY } from './player-presets.svelte';

describe('createPresetStore', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('starts empty when nothing is stored', () => {
		const store = createPresetStore();
		expect(store.presets).toEqual([]);
		expect(store.defaultId).toBeNull();
		expect(store.defaultPreset).toBeUndefined();
	});

	it('persists an added preset to localStorage and reloads it', () => {
		const store = createPresetStore();
		const id = store.add('Crew', ['A', 'B']);

		expect(store.presets).toHaveLength(1);
		expect(localStorage.getItem(STORAGE_KEY)).toContain('Crew');

		// A fresh instance (e.g. a later page visit) sees the same data.
		const reloaded = createPresetStore();
		expect(reloaded.presets.map((p) => p.id)).toEqual([id]);
		expect(reloaded.presets[0]).toMatchObject({ name: 'Crew', players: ['A', 'B'] });
	});

	it('tracks the default preset', () => {
		const store = createPresetStore();
		const id = store.add('Crew', ['A']);
		store.setDefault(id);

		expect(store.defaultId).toBe(id);
		expect(store.defaultPreset?.name).toBe('Crew');

		const reloaded = createPresetStore();
		expect(reloaded.defaultId).toBe(id);
	});

	it('updates and removes presets', () => {
		const store = createPresetStore();
		const id = store.add('Crew', ['A']);
		store.update(id, { name: 'Renamed', players: ['X', 'Y'] });
		expect(store.presets[0]).toMatchObject({ name: 'Renamed', players: ['X', 'Y'] });

		store.remove(id);
		expect(store.presets).toEqual([]);
		expect(createPresetStore().presets).toEqual([]);
	});

	it('recovers from corrupt storage by starting empty', () => {
		localStorage.setItem(STORAGE_KEY, '{not valid json');
		const store = createPresetStore();
		expect(store.presets).toEqual([]);
	});
});

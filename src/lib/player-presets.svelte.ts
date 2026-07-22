import { browser } from '$app/environment';
import {
	addPreset,
	deletePreset,
	emptyStore,
	getDefaultPreset,
	makePreset,
	parseStore,
	serializeStore,
	setDefaultPreset,
	updatePreset,
	type Preset,
	type PresetStore
} from '$lib/player-presets';

export const STORAGE_KEY = 'genshin-party:presets:v1';

/**
 * Reactive, localStorage-backed party presets. Each page creates its own
 * instance; state lives in localStorage, so a preset saved on the settings
 * page is seen by a later visit to `/interactive` (which remounts and reloads).
 *
 * SSR-safe: reads and writes are guarded by `browser`, so the initial server
 * render sees an empty store and the client hydrates from localStorage when the
 * component initializes. Corrupt storage is tolerated by `parseStore`.
 */
export function createPresetStore() {
	let store = $state<PresetStore>(load());

	function load(): PresetStore {
		if (!browser) return emptyStore();
		try {
			return parseStore(localStorage.getItem(STORAGE_KEY));
		} catch {
			return emptyStore();
		}
	}

	function commit(next: PresetStore) {
		store = next;
		if (!browser) return;
		try {
			localStorage.setItem(STORAGE_KEY, serializeStore(store));
		} catch {
			// Storage can be full or disabled (private mode); keep the in-memory
			// state usable for this session rather than crashing the page.
		}
	}

	return {
		get presets(): readonly Preset[] {
			return store.presets;
		},
		get defaultId(): string | null {
			return store.defaultId;
		},
		get defaultPreset(): Preset | undefined {
			return getDefaultPreset(store);
		},
		/** Create a preset and return its id (the caller may set it as default). */
		add(name: string, players: readonly string[]): string {
			const preset = makePreset(name, players);
			commit(addPreset(store, preset));
			return preset.id;
		},
		update(id: string, patch: { name?: string; players?: readonly string[] }) {
			commit(updatePreset(store, id, patch));
		},
		remove(id: string) {
			commit(deletePreset(store, id));
		},
		setDefault(id: string | null) {
			commit(setDefaultPreset(store, id));
		},
		/** Re-read from localStorage (e.g. after another tab changed it). */
		reload() {
			store = load();
		}
	};
}

export type PresetStoreController = ReturnType<typeof createPresetStore>;

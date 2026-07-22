import { PARTY_SIZE } from '$lib/party-flow.svelte';

/**
 * A saved "party" of player names the user can reuse to seed the interactive
 * flow. Players are stored as 1..PARTY_SIZE trimmed, non-empty names — the same
 * labels the interactive form collects. Characters are always rolled, never
 * part of a preset. Expansion to four slots is deliberately *not* baked in:
 * a preset keeps the raw names and `expandPlayerNames` runs at start time.
 */
export interface Preset {
	readonly id: string;
	readonly name: string;
	readonly players: readonly string[];
}

/** The full persisted shape: every preset plus which one is the default. */
export interface PresetStore {
	readonly presets: readonly Preset[];
	/** Id of the preset that pre-fills the interactive form, or null. */
	readonly defaultId: string | null;
}

export const emptyStore = (): PresetStore => ({ presets: [], defaultId: null });

/** Trim, drop blanks, cap at PARTY_SIZE — the canonical player-name list. */
export const normalizePlayers = (players: readonly string[]): string[] =>
	players
		.map((name) => name.trim())
		.filter((name) => name.length > 0)
		.slice(0, PARTY_SIZE);

/**
 * Validate a preset the user is trying to save. Lenient by design: a name is
 * required and at least one player name must survive normalization. Returns an
 * error message to display, or null when the input is savable.
 */
export const validatePresetInput = (name: string, players: readonly string[]): string | null => {
	if (name.trim().length === 0) return 'Preset name is required.';
	if (normalizePlayers(players).length === 0) return 'Add at least one player name.';
	return null;
};

/** Build a fresh preset with a generated id. Callers should validate first. */
export const makePreset = (name: string, players: readonly string[]): Preset => ({
	id: crypto.randomUUID(),
	name: name.trim(),
	players: normalizePlayers(players)
});

export const addPreset = (store: PresetStore, preset: Preset): PresetStore => ({
	...store,
	presets: [...store.presets, preset]
});

export const updatePreset = (
	store: PresetStore,
	id: string,
	patch: { name?: string; players?: readonly string[] }
): PresetStore => ({
	...store,
	presets: store.presets.map((preset) =>
		preset.id === id
			? {
					...preset,
					...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
					...(patch.players !== undefined ? { players: normalizePlayers(patch.players) } : {})
				}
			: preset
	)
});

export const deletePreset = (store: PresetStore, id: string): PresetStore => ({
	presets: store.presets.filter((preset) => preset.id !== id),
	defaultId: store.defaultId === id ? null : store.defaultId
});

/** Set (or clear, with null) the default preset. Unknown ids are ignored. */
export const setDefaultPreset = (store: PresetStore, id: string | null): PresetStore => {
	if (id !== null && !store.presets.some((preset) => preset.id === id)) return store;
	return { ...store, defaultId: id };
};

export const getDefaultPreset = (store: PresetStore): Preset | undefined =>
	store.presets.find((preset) => preset.id === store.defaultId);

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null;

/** Coerce one untrusted entry into a Preset, or drop it (returns null). */
const toPreset = (value: unknown): Preset | null => {
	if (!isRecord(value)) return null;
	const { id, name, players } = value;
	if (typeof id !== 'string' || typeof name !== 'string') return null;
	const cleanName = name.trim();
	if (cleanName.length === 0) return null;
	const cleanPlayers = normalizePlayers(
		Array.isArray(players) ? players.filter((p): p is string => typeof p === 'string') : []
	);
	if (cleanPlayers.length === 0) return null;
	return { id, name: cleanName, players: cleanPlayers };
};

/**
 * Parse the persisted JSON back into a store, tolerating anything. Malformed
 * or legacy data is discarded entry-by-entry rather than throwing, so a bad
 * localStorage value can never break the page — it just reads as empty. Ids
 * are de-duplicated and `defaultId` is dropped unless it still resolves.
 */
export const parseStore = (raw: string | null | undefined): PresetStore => {
	if (!raw) return emptyStore();
	let data: unknown;
	try {
		data = JSON.parse(raw);
	} catch {
		return emptyStore();
	}
	if (!isRecord(data)) return emptyStore();
	const { presets: rawPresets, defaultId: rawDefaultId } = data;
	if (!Array.isArray(rawPresets)) return emptyStore();

	const seen = new Set<string>();
	const presets: Preset[] = [];
	for (const entry of rawPresets) {
		const preset = toPreset(entry);
		if (preset && !seen.has(preset.id)) {
			seen.add(preset.id);
			presets.push(preset);
		}
	}

	const defaultId =
		typeof rawDefaultId === 'string' && seen.has(rawDefaultId) ? rawDefaultId : null;
	return { presets, defaultId };
};

export const serializeStore = (store: PresetStore): string => JSON.stringify(store);

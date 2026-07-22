<script lang="ts">
	import { tick } from 'svelte';
	import { PARTY_SIZE } from '$lib/party-flow.svelte';
	import { validatePresetInput } from '$lib/player-presets';
	import type { PresetStoreController } from '$lib/player-presets.svelte';

	interface Props {
		store: PresetStoreController;
	}

	let { store }: Props = $props();

	// The editor doubles as create and edit: `editingId === null` means the
	// draft will be saved as a new preset; otherwise it patches that preset.
	let editingId = $state<string | null>(null);
	let draftName = $state('');
	let draftPlayers = $state<string[]>(['']);
	let error = $state('');
	let nameInputRef = $state<HTMLInputElement | undefined>();
	let playerInputRefs = $state<HTMLInputElement[]>([]);

	const isEditing = $derived(editingId !== null);

	function resetEditor() {
		editingId = null;
		draftName = '';
		draftPlayers = [''];
		error = '';
	}

	async function editPreset(id: string) {
		const preset = store.presets.find((p) => p.id === id);
		if (!preset) return;
		editingId = id;
		draftName = preset.name;
		draftPlayers = preset.players.length ? [...preset.players] : [''];
		error = '';
		await tick();
		nameInputRef?.focus();
	}

	function save() {
		const validationError = validatePresetInput(draftName, draftPlayers);
		if (validationError) {
			error = validationError;
			return;
		}
		if (editingId !== null) {
			store.update(editingId, { name: draftName, players: draftPlayers });
		} else {
			store.add(draftName, draftPlayers);
		}
		resetEditor();
	}

	function deletePreset(id: string) {
		store.remove(id);
		if (editingId === id) resetEditor();
	}

	async function addPlayer() {
		if (draftPlayers.length < PARTY_SIZE) {
			draftPlayers = [...draftPlayers, ''];
			await tick();
			playerInputRefs.at(-1)?.focus();
		}
	}

	async function removePlayer(index: number) {
		if (draftPlayers.length > 1) {
			const nextIndex = index === 0 ? 0 : index - 1;
			draftPlayers = draftPlayers.filter((_, i) => i !== index);
			await tick();
			playerInputRefs[nextIndex]?.focus();
		}
	}
</script>

<section class="preset-manager">
	<form
		class="preset-editor"
		aria-label={isEditing ? 'Edit preset' : 'New preset'}
		onsubmit={(event) => {
			event.preventDefault();
			save();
		}}
	>
		<h2>{isEditing ? 'Edit preset' : 'New preset'}</h2>

		<label class="field">
			Preset name
			<input
				bind:this={nameInputRef}
				class="input"
				bind:value={draftName}
				placeholder="e.g. Weeknight crew"
				type="text"
			/>
		</label>

		<fieldset>
			<legend>Player names</legend>
			<div class="player-inputs">
				{#each draftPlayers, index (index)}
					<div class="player-input-row">
						<label>
							Player {index + 1}
							<input
								bind:this={playerInputRefs[index]}
								class="input"
								bind:value={draftPlayers[index]}
								placeholder="Name"
								type="text"
							/>
						</label>
						{#if draftPlayers.length > 1}
							<button
								aria-label={`Remove player ${index + 1}`}
								class="remove-player btn btn-sm preset-tonal-error"
								onclick={() => {
									void removePlayer(index);
								}}
								type="button"
							>
								Remove
							</button>
						{/if}
					</div>
				{/each}
			</div>
			{#if draftPlayers.length < PARTY_SIZE}
				<button
					class="add-player btn btn-sm preset-tonal-secondary"
					onclick={() => void addPlayer()}
					type="button">Add player</button
				>
			{/if}
		</fieldset>

		{#if error}
			<p class="error" role="alert">{error}</p>
		{/if}

		<div class="editor-actions">
			<button class="btn preset-filled-primary-500" type="submit">
				{isEditing ? 'Save changes' : 'Add preset'}
			</button>
			{#if isEditing}
				<button class="btn preset-tonal-surface" type="button" onclick={resetEditor}>Cancel</button>
			{/if}
		</div>
	</form>

	<section class="saved-parties">
		<h2>Saved parties</h2>
		{#if store.presets.length === 0}
			<p class="empty">No saved parties yet. Create one above to pre-fill the interactive form.</p>
		{:else}
			<fieldset class="default-group">
				<legend>Default party (pre-fills the interactive form)</legend>
				<label class="default-option">
					<input
						type="radio"
						name="default-preset"
						checked={store.defaultId === null}
						onchange={() => {
							store.setDefault(null);
						}}
					/>
					None
				</label>
				<ul class="preset-list">
					{#each store.presets as preset (preset.id)}
						<li class="preset-row">
							<label class="default-option">
								<input
									type="radio"
									name="default-preset"
									checked={store.defaultId === preset.id}
									onchange={() => {
										store.setDefault(preset.id);
									}}
								/>
								<span class="visually-hidden">Set {preset.name} as default</span>
							</label>
							<div class="preset-info">
								<span class="preset-name">
									{preset.name}
									{#if store.defaultId === preset.id}
										<span class="badge">Default</span>
									{/if}
								</span>
								<span class="preset-players">{preset.players.join(', ')}</span>
							</div>
							<div class="preset-actions">
								<button
									class="btn btn-sm preset-tonal-surface"
									type="button"
									onclick={() => void editPreset(preset.id)}
								>
									Edit
								</button>
								<button
									aria-label={`Delete ${preset.name}`}
									class="btn btn-sm preset-tonal-error"
									type="button"
									onclick={() => {
										deletePreset(preset.id);
									}}
								>
									Delete
								</button>
							</div>
						</li>
					{/each}
				</ul>
			</fieldset>
		{/if}
	</section>
</section>

<style>
	.preset-manager {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.preset-editor {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem 1.5rem;
		border: 1px solid var(--color-surface-300, rgb(0 0 0 / 15%));
		border-radius: 0.5rem;
	}

	.saved-parties {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		max-width: 24rem;
	}

	.preset-editor fieldset,
	.default-group {
		border: 0;
		padding: 0;
		margin: 0;
	}

	.preset-editor legend,
	.default-group legend {
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.player-inputs {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.player-input-row {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
	}

	.player-input-row label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}

	.remove-player {
		padding-inline: 0.5rem;
	}

	.editor-actions {
		display: flex;
		gap: 0.5rem;
	}

	.preset-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.preset-row {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: start;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-surface-300, rgb(0 0 0 / 15%));
		border-radius: 0.5rem;
	}

	.preset-info {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.preset-name {
		font-weight: 600;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.preset-players {
		font-size: 0.875rem;
		opacity: 0.8;
	}

	.badge {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		background: var(--color-primary-500, #3b82f6);
		color: white;
	}

	.default-option {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.preset-actions {
		align-self: center;
		display: flex;
		gap: 0.5rem;
	}

	.empty {
		opacity: 0.8;
	}
</style>

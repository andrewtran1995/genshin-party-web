<script lang="ts">
	import { tick } from 'svelte';
	import { PARTY_SIZE } from '$lib/party-flow.svelte';

	interface Props {
		players: string[];
		placeholder?: string;
		/**
		 * When true, Enter in a name input advances rather than submitting: on an
		 * earlier row it moves focus to the next input; on the last row it opens a
		 * new slot (up to PARTY_SIZE). Only at the cap does Enter fall through to
		 * the form's native submit, so keyboard users are never stranded. Left off
		 * (the default), Enter keeps the browser's implicit-submit behaviour.
		 */
		advanceOnEnter?: boolean;
	}

	let {
		// eslint-disable-next-line @typescript-eslint/no-useless-default-assignment
		players = $bindable(),
		placeholder = 'Name',
		advanceOnEnter = false
	}: Props = $props();

	let inputRefs = $state<HTMLInputElement[]>([]);
	let rowRefs = $state<HTMLDivElement[]>([]);
	let handleRefs = $state<HTMLButtonElement[]>([]);

	// A stable per-row identity, independent of list position, so the keyed
	// each block moves existing DOM nodes (and their focus/input state) during
	// a drag instead of recreating them.
	let nextRowId = 0;
	function makeRowId(): string {
		nextRowId += 1;
		return `row-${nextRowId}`;
	}
	let rowIds = $state<string[]>(players.map(() => makeRowId()));

	// Reconcile row ids when the caller swaps `players` wholesale (loading a
	// preset, resetting the form) rather than through this component's own
	// add/remove/move helpers, which already keep both arrays in lockstep.
	$effect(() => {
		if (rowIds.length !== players.length) {
			rowIds = players.map((_, i) => rowIds[i] ?? makeRowId());
		}
	});

	let draggingIndex = $state<number | null>(null);

	export function focusFirst() {
		inputRefs[0]?.focus();
	}

	export function focusLast() {
		inputRefs.at(-1)?.focus();
	}

	async function addPlayer() {
		if (players.length < PARTY_SIZE) {
			players = [...players, ''];
			rowIds = [...rowIds, makeRowId()];
			await tick();
			focusLast();
		}
	}

	async function removePlayer(index: number) {
		if (players.length > 1) {
			const nextIndex = index === 0 ? 0 : index - 1;
			players = players.filter((_, i) => i !== index);
			rowIds = rowIds.filter((_, i) => i !== index);
			await tick();
			inputRefs[nextIndex]?.focus();
		}
	}

	function movePlayer(from: number, to: number) {
		if (from === to || from < 0 || to < 0 || from >= players.length || to >= players.length) return;
		const nextPlayers = [...players];
		const [movedPlayer] = nextPlayers.splice(from, 1);
		if (movedPlayer === undefined) return;
		nextPlayers.splice(to, 0, movedPlayer);
		players = nextPlayers;

		const nextIds = [...rowIds];
		const [movedId] = nextIds.splice(from, 1);
		if (movedId === undefined) return;
		nextIds.splice(to, 0, movedId);
		rowIds = nextIds;
	}

	// Which row the pointer is currently over, by comparing its Y position to
	// each row's vertical midpoint.
	function rowIndexAt(clientY: number): number | null {
		for (let i = 0; i < rowRefs.length; i++) {
			const rect = rowRefs[i]?.getBoundingClientRect();
			if (rect && clientY < rect.top + rect.height / 2) return i;
		}
		return rowRefs.length > 0 ? rowRefs.length - 1 : null;
	}

	function startDrag(event: PointerEvent, index: number) {
		if (event.pointerType === 'mouse' && event.button !== 0) return;
		draggingIndex = index;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}

	function dragMove(event: PointerEvent) {
		if (draggingIndex === null) return;
		event.preventDefault();
		const target = rowIndexAt(event.clientY);
		if (target !== null && target !== draggingIndex) {
			movePlayer(draggingIndex, target);
			draggingIndex = target;
		}
	}

	function endDrag() {
		draggingIndex = null;
	}

	// The moved row keeps its DOM node (keyed each), but focus can still drop
	// during the reflow, so it's restored explicitly onto the handle's new slot.
	async function handleReorderKeydown(event: KeyboardEvent, index: number) {
		let target: number | undefined;
		if (event.key === 'ArrowUp' && index > 0) {
			target = index - 1;
		} else if (event.key === 'ArrowDown' && index < players.length - 1) {
			target = index + 1;
		} else {
			return;
		}
		event.preventDefault();
		movePlayer(index, target);
		await tick();
		handleRefs[target]?.focus();
	}

	function handleKeydown(event: KeyboardEvent, index: number) {
		// Ignore Enter that confirms an IME composition (e.g. Japanese/Chinese
		// input) — otherwise we'd swallow the character and spawn a stray slot.
		if (event.key !== 'Enter' || event.isComposing) return;
		const isLastRow = index === players.length - 1;
		if (!isLastRow) {
			// Advance down the list like Tab rather than submitting mid-form.
			event.preventDefault();
			inputRefs[index + 1]?.focus();
			return;
		}
		if (players.length < PARTY_SIZE) {
			event.preventDefault();
			void addPlayer();
		}
		// At the cap on the last row: let native implicit submission run.
	}
</script>

<div class="player-inputs">
	{#each players as name, index (rowIds[index])}
		<div
			class="player-input-row"
			class:dragging={draggingIndex === index}
			bind:this={rowRefs[index]}
		>
			{#if players.length > 1}
				<button
					type="button"
					class="drag-handle btn-icon btn-icon-sm preset-tonal-surface"
					aria-label={`Reorder player ${index + 1}`}
					title={name.trim() ? `Move ${name.trim()}` : undefined}
					bind:this={handleRefs[index]}
					onpointerdown={(event) => {
						startDrag(event, index);
					}}
					onpointermove={dragMove}
					onpointerup={endDrag}
					onpointercancel={endDrag}
					onkeydown={(event) => {
						void handleReorderKeydown(event, index);
					}}
				>
					<svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<circle cx="9" cy="6" r="1.5" />
						<circle cx="9" cy="12" r="1.5" />
						<circle cx="9" cy="18" r="1.5" />
						<circle cx="15" cy="6" r="1.5" />
						<circle cx="15" cy="12" r="1.5" />
						<circle cx="15" cy="18" r="1.5" />
					</svg>
				</button>
			{/if}
			<label>
				Player {index + 1}
				<input
					bind:this={inputRefs[index]}
					class="input"
					bind:value={players[index]}
					onkeydown={advanceOnEnter
						? (event) => {
								handleKeydown(event, index);
							}
						: undefined}
					{placeholder}
					type="text"
				/>
			</label>
			{#if players.length > 1}
				<button
					aria-label={`Remove player ${index + 1}`}
					class="remove-player btn btn-sm preset-tonal-error"
					onclick={() => void removePlayer(index)}
					type="button"
				>
					Remove
				</button>
			{/if}
		</div>
	{/each}
</div>
{#if players.length < PARTY_SIZE}
	<button
		class="add-player btn btn-sm preset-tonal-secondary"
		onclick={() => void addPlayer()}
		type="button"
	>
		Add player
	</button>
{/if}

<style>
	.player-inputs {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 18rem;
		margin-bottom: 0.75rem;
	}

	.player-input-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.player-input-row.dragging {
		opacity: 0.5;
	}

	.player-input-row label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
		min-width: 0;
	}

	.drag-handle {
		flex-shrink: 0;
		cursor: grab;
		touch-action: none;
	}

	.drag-handle:active {
		cursor: grabbing;
	}

	.remove-player {
		align-self: center;
		flex-shrink: 0;
		padding-inline: 0.5rem;
	}
</style>

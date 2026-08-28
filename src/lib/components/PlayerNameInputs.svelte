<script lang="ts">
	import { tick } from 'svelte';
	import {
		DndContext,
		PointerSensor,
		closestCenter,
		useSensor,
		type DragEndEvent
	} from '@dnd-kit-svelte/core';
	import {
		SortableContext,
		arrayMove,
		verticalListSortingStrategy
	} from '@dnd-kit-svelte/sortable';
	import PlayerNameRow from './PlayerNameRow.svelte';
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

	let rowComponents = $state<{ focus: () => void; focusHandle: () => void }[]>([]);

	// A stable per-row identity, independent of list position, so dnd-kit and
	// the keyed each block can track a row through a drag instead of treating
	// every reorder as new rows.
	let nextRowId = 0;
	function makeRowId(): string {
		nextRowId += 1;
		return `row-${nextRowId}`;
	}
	let rowIds = $state<string[]>(players.map(() => makeRowId()));

	// Reconcile row ids when the caller swaps `players` wholesale (loading a
	// preset, resetting the form) rather than through this component's own
	// add/remove/drag helpers, which already keep both arrays in lockstep.
	$effect(() => {
		if (rowIds.length !== players.length) {
			rowIds = players.map((_, i) => rowIds[i] ?? makeRowId());
		}
	});

	// Pointer-only: @dnd-kit-svelte/sortable's KeyboardSensor coordinate getter
	// (0.0.11) throws when it finds a real adjacent target, so ArrowUp/ArrowDown
	// on the handle are instead handled directly below via `movePlayer`.
	const sensors = [useSensor(PointerSensor)];

	export function focusFirst() {
		rowComponents[0]?.focus();
	}

	export function focusLast() {
		rowComponents.at(-1)?.focus();
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
			rowComponents[nextIndex]?.focus();
		}
	}

	function movePlayer(from: number, to: number) {
		if (from === to || from < 0 || to < 0 || from >= players.length || to >= players.length) return;
		players = arrayMove(players, from, to);
		rowIds = arrayMove(rowIds, from, to);
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const from = rowIds.indexOf(String(active.id));
		const to = rowIds.indexOf(String(over.id));
		if (from === -1 || to === -1) return;
		movePlayer(from, to);
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
		rowComponents[target]?.focusHandle();
	}

	function handleEnterKeydown(event: KeyboardEvent, index: number) {
		// Ignore Enter that confirms an IME composition (e.g. Japanese/Chinese
		// input) — otherwise we'd swallow the character and spawn a stray slot.
		if (event.key !== 'Enter' || event.isComposing) return;
		const isLastRow = index === players.length - 1;
		if (!isLastRow) {
			// Advance down the list like Tab rather than submitting mid-form.
			event.preventDefault();
			rowComponents[index + 1]?.focus();
			return;
		}
		if (players.length < PARTY_SIZE) {
			event.preventDefault();
			void addPlayer();
		}
		// At the cap on the last row: let native implicit submission run.
	}
</script>

<DndContext {sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
	<SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
		<div class="player-inputs">
			{#each rowIds as rowId, index (rowId)}
				<PlayerNameRow
					id={rowId}
					{index}
					bind:value={
						() => players[index] ?? '',
						(value) => {
							players[index] = value;
						}
					}
					{placeholder}
					showRemove={players.length > 1}
					{advanceOnEnter}
					bind:this={rowComponents[index]}
					onremove={() => void removePlayer(index)}
					onenterkeydown={(event) => {
						handleEnterKeydown(event, index);
					}}
					onreorderkeydown={(event) => {
						void handleReorderKeydown(event, index);
					}}
				/>
			{/each}
		</div>
	</SortableContext>
</DndContext>
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
</style>

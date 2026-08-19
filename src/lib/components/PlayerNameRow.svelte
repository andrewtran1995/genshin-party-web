<script lang="ts">
	import { useSortable } from '@dnd-kit-svelte/sortable';
	import { CSS, styleObjectToString } from '@dnd-kit-svelte/utilities';

	interface Props {
		id: string;
		index: number;
		value: string;
		placeholder: string;
		showRemove: boolean;
		advanceOnEnter: boolean;
		onremove: () => void;
		onenterkeydown?: (event: KeyboardEvent) => void;
		onreorderkeydown?: (event: KeyboardEvent) => void;
	}

	let {
		// eslint-disable-next-line @typescript-eslint/no-useless-default-assignment
		value = $bindable(),
		id,
		index,
		placeholder,
		showRemove,
		advanceOnEnter,
		onremove,
		onenterkeydown,
		onreorderkeydown
	}: Props = $props();

	let inputEl = $state<HTMLInputElement | undefined>(undefined);
	// Tracked separately from dnd-kit's own `activatorNode` box, which can go
	// stale mid-reorder (its ref briefly clears while dnd-kit's internal
	// effects settle), dropping focus if relied on right after a move.
	let handleEl = $state<HTMLButtonElement | undefined>(undefined);

	export function focus() {
		inputEl?.focus();
	}

	export function focusHandle() {
		handleEl?.focus();
	}

	function captureHandle(el: HTMLButtonElement) {
		handleEl = el;
		return () => {
			if (handleEl === el) handleEl = undefined;
		};
	}

	const { attributes, listeners, node, activatorNode, transform, transition, isDragging } =
		useSortable({
			get id() {
				return id;
			}
		});

	const style = $derived(
		styleObjectToString({
			transform: CSS.Transform.toString(transform.current),
			transition: transition.current,
			zIndex: isDragging.current ? 1 : undefined
		})
	);
</script>

<div class="player-input-row" class:dragging={isDragging.current} bind:this={node.current} {style}>
	{#if showRemove}
		<button
			type="button"
			class="drag-handle btn-icon btn-icon-sm preset-tonal-surface"
			aria-label={`Reorder player ${index + 1}`}
			title={value.trim() ? `Move ${value.trim()}` : undefined}
			bind:this={activatorNode.current}
			{@attach captureHandle}
			{...listeners.current}
			{...attributes.current}
			onkeydown={(event) => {
				onreorderkeydown?.(event);
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
			bind:this={inputEl}
			class="input"
			bind:value
			onkeydown={advanceOnEnter
				? (event) => {
						onenterkeydown?.(event);
					}
				: undefined}
			{placeholder}
			type="text"
		/>
	</label>
	{#if showRemove}
		<button
			aria-label={`Remove player ${index + 1}`}
			class="remove-player btn btn-sm preset-tonal-error"
			onclick={onremove}
			type="button"
		>
			Remove
		</button>
	{/if}
</div>

<style>
	.player-input-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background-color: var(--color-surface-100-900);
		border: 1px solid var(--color-surface-300-700);
		border-radius: var(--radius-base);
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
		padding: 0.625rem;
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

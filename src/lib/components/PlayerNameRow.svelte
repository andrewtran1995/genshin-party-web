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

	// `transition` is deliberately not taken from useSortable: in this release it
	// swaps to a 0ms "disabled" transition on paths that misfire under Svelte
	// (a FLIP setup frame cleared in the same effect flush, and a staleness bug
	// where a `$derived` reads a plain non-reactive object), so displaced rows
	// animate or snap at random. The transition is driven from CSS below instead.
	const { attributes, listeners, node, activatorNode, transform, isDragging, isSorting } =
		useSortable({
			get id() {
				return id;
			}
		});

	const style = $derived(
		styleObjectToString({
			transform: CSS.Transform.toString(transform.current),
			zIndex: isDragging.current ? 1 : undefined
		})
	);
</script>

<div
	class="player-input-row"
	class:dragging={isDragging.current}
	class:displacing={isSorting.current && !isDragging.current}
	bind:this={node.current}
	{style}
>
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

	/*
	 * Only rows displaced by an in-flight drag animate. The dragged row itself
	 * must track the pointer 1:1 (no DragOverlay is rendered), and once the drag
	 * ends nothing transitions — otherwise the drop's DOM reorder and the
	 * transform reset race and the row visibly jumps before sliding back.
	 */
	.player-input-row.displacing {
		transition: transform 200ms ease;
	}

	.player-input-row.dragging {
		opacity: 0.5;
	}

	@media (prefers-reduced-motion: reduce) {
		.player-input-row.displacing {
			transition: none;
		}
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

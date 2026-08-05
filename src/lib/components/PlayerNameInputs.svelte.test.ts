import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PlayerNameInputs from './PlayerNameInputs.svelte';

const inputs = (container: HTMLElement) => [
	...container.querySelectorAll<HTMLInputElement>('.player-inputs input')
];

const values = (container: HTMLElement) => inputs(container).map((input) => input.value);

const req = <T>(value: T | null | undefined): T => {
	if (value == null) throw new Error('expected a value');
	return value;
};

const handle = (container: HTMLElement, playerNumber: number) =>
	req(
		container.querySelector<HTMLButtonElement>(
			`button[aria-label="Reorder player ${playerNumber}"]`
		)
	);

// Simulate a pointer drag of one row onto another using the component's own
// pointer handlers (no native HTML5 drag-and-drop, which doesn't fire in
// jsdom-less real-browser tests without a lot of extra plumbing).
function dragRowOnto(container: HTMLElement, fromPlayerNumber: number, ontoRowIndex: number) {
	const rows = [...container.querySelectorAll<HTMLElement>('.player-input-row')];
	const targetRow = req(rows[ontoRowIndex]);
	const clientY = targetRow.getBoundingClientRect().top + 1;
	const dragHandle = handle(container, fromPlayerNumber);

	dragHandle.dispatchEvent(
		new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, clientY: 0 })
	);
	dragHandle.dispatchEvent(
		new PointerEvent('pointermove', { bubbles: true, pointerId: 1, clientY })
	);
	dragHandle.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 }));
}

describe('PlayerNameInputs', () => {
	it('hides the drag handle when there is only one player', async () => {
		const { container } = await render(PlayerNameInputs, { props: { players: ['Ann'] } });
		expect(container.querySelector('.drag-handle')).toBeNull();
	});

	it('shows a drag handle per row once there is more than one player', async () => {
		const { container } = await render(PlayerNameInputs, {
			props: { players: ['Ann', 'Bob'] }
		});
		expect(container.querySelectorAll('.drag-handle')).toHaveLength(2);
	});

	it('moves a row down with ArrowDown on its drag handle', async () => {
		const { container } = await render(PlayerNameInputs, {
			props: { players: ['Ann', 'Bob', 'Cara'] }
		});
		expect(values(container)).toEqual(['Ann', 'Bob', 'Cara']);

		handle(container, 1).dispatchEvent(
			new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
		);

		await expect.poll(() => values(container)).toEqual(['Bob', 'Ann', 'Cara']);
	});

	it('moves a row up with ArrowUp on its drag handle', async () => {
		const { container } = await render(PlayerNameInputs, {
			props: { players: ['Ann', 'Bob', 'Cara'] }
		});

		handle(container, 3).dispatchEvent(
			new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true })
		);

		await expect.poll(() => values(container)).toEqual(['Ann', 'Cara', 'Bob']);
	});

	it('does not move past the first or last row', async () => {
		const { container } = await render(PlayerNameInputs, {
			props: { players: ['Ann', 'Bob'] }
		});

		handle(container, 1).dispatchEvent(
			new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true })
		);
		handle(container, 2).dispatchEvent(
			new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
		);

		expect(values(container)).toEqual(['Ann', 'Bob']);
	});

	it('keeps focus on the same row after it moves', async () => {
		const { container } = await render(PlayerNameInputs, {
			props: { players: ['Ann', 'Bob', 'Cara'] }
		});
		const moved = handle(container, 1);
		moved.focus();

		moved.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
		);

		await expect.poll(() => values(container)).toEqual(['Bob', 'Ann', 'Cara']);
		expect(document.activeElement).toBe(moved);
	});

	it('reorders rows by dragging one past another', async () => {
		const { container } = await render(PlayerNameInputs, {
			props: { players: ['Ann', 'Bob', 'Cara'] }
		});

		dragRowOnto(container, 2, 2);

		await expect.poll(() => values(container)).toEqual(['Ann', 'Cara', 'Bob']);
	});
});

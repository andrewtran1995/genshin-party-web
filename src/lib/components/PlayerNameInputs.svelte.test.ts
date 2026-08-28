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

	it('keeps focus on the row after it moves', async () => {
		const { container } = await render(PlayerNameInputs, {
			props: { players: ['Ann', 'Bob', 'Cara'] }
		});
		const moved = handle(container, 1);
		moved.focus();

		moved.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
		);

		await expect.poll(() => values(container)).toEqual(['Bob', 'Ann', 'Cara']);
		// Ann is now player 2; focus follows to whichever handle occupies that
		// slot (dnd-kit re-registers its own ref for the activator each move).
		await expect.poll(() => document.activeElement).toBe(handle(container, 2));
	});

	// dnd-kit's PointerSensor drives this: a real (Playwright-backed) pointer
	// drag of one handle onto another reorders the underlying arrays.
	it('reorders rows by dragging the handle with a pointer', async () => {
		const { container, getByRole } = await render(PlayerNameInputs, {
			props: { players: ['Ann', 'Bob', 'Cara'] }
		});

		await getByRole('button', { name: 'Reorder player 2' }).dropTo(
			getByRole('button', { name: 'Reorder player 3' })
		);

		await expect.poll(() => values(container)).toEqual(['Ann', 'Cara', 'Bob']);
	});
});

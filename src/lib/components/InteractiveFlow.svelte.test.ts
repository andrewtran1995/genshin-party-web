import { describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'svelte';
import { render } from 'vitest-browser-svelte';
import InteractiveFlow from './InteractiveFlow.svelte';
import type { Char } from '$lib/types';
import type { PlayerChoice, PlayerSelectionState } from '$lib/player-selection-stack';

const makeChar = (name: string): Char => ({
	id: name.length,
	name,
	title: '',
	rarity: 5,
	element: 'anemo',
	elementText: 'Anemo',
	weaponText: 'Sword',
	region: '',
	portrait: undefined,
	icon: undefined,
	fandomUrl: undefined
});

const pick = (number: number, name: string, isMain = false): PlayerChoice => ({
	char: makeChar(name),
	isMain,
	number
});

const activeState: PlayerSelectionState = {
	status: 'active',
	playerChoices: [],
	playerOrder: [1, 2, 3, 4]
};

const finalPickState: PlayerSelectionState = {
	status: 'active',
	playerChoices: [pick(1, 'Furina'), pick(2, 'Kazuha'), pick(3, 'Nahida')],
	playerOrder: [1, 2, 3, 4]
};

const doneState: PlayerSelectionState = {
	status: 'done',
	playerChoices: [pick(1, 'Furina'), pick(2, 'Kazuha'), pick(3, 'Nahida'), pick(4, 'Bennett')],
	playerOrder: [1, 2, 3, 4]
};

type Props = ComponentProps<typeof InteractiveFlow>;

const baseProps = (overrides: Partial<Props> = {}): Props => ({
	selectionState: undefined,
	currentPlayerNumber: undefined,
	candidate: undefined,
	loading: false,
	error: '',
	expandedNames: [],
	onstart: vi.fn(),
	onaccept: vi.fn(),
	onreroll: vi.fn(),
	ongoback: vi.fn(),
	onreset: vi.fn(),
	...overrides
});

const choosing = (overrides: Partial<Props> = {}): Props =>
	baseProps({
		selectionState: activeState,
		currentPlayerNumber: 1,
		candidate: makeChar('Furina'),
		...overrides
	});

// Find a button by its exact (trimmed) label.
const button = (container: HTMLElement, label: string) => {
	const match = [...container.querySelectorAll<HTMLButtonElement>('button')].find(
		(b) => b.textContent.trim() === label
	);
	if (!match) throw new Error(`No button labelled "${label}"`);
	return match;
};

// Find a button by its accessible (aria-label) name — e.g. the icon-less
// "Remove" buttons, whose visible text is just "Remove".
const buttonByLabel = (container: HTMLElement, ariaLabel: string) => {
	const match = container.querySelector<HTMLButtonElement>(`button[aria-label="${ariaLabel}"]`);
	if (!match) throw new Error(`No button with aria-label "${ariaLabel}"`);
	return match;
};

const activeLabel = () => document.activeElement?.textContent.trim();

describe('InteractiveFlow', () => {
	describe('view selection', () => {
		it('shows the player-names form when there is no selection state', async () => {
			const { container } = await render(InteractiveFlow, { props: baseProps() });
			expect(container.querySelector('form.player-form')).not.toBeNull();
			expect(button(container, 'Start')).toBeInstanceOf(HTMLButtonElement);
		});

		it('announces and renders the candidate while choosing', async () => {
			const { container } = await render(InteractiveFlow, {
				props: choosing({ expandedNames: ['Ann'] })
			});
			expect(container.textContent).toContain('Now choosing for Player 1 (Ann)');
			const live = container.querySelector('.visually-hidden[aria-live="polite"]');
			expect(live?.textContent).toContain('Candidate: Furina');
			expect(container.querySelector('.candidate')).not.toBeNull();
		});

		it('announces completion and offers a restart when done', async () => {
			const { container } = await render(InteractiveFlow, {
				props: baseProps({ selectionState: doneState })
			});
			const live = container.querySelector('.visually-hidden[aria-live="polite"]');
			expect(live?.textContent).toContain('Party complete');
			expect(container.querySelectorAll('.party-result > li')).toHaveLength(4);
			expect(button(container, 'Start over')).toBeInstanceOf(HTMLButtonElement);
		});

		it('shows a rolling announcement instead of a card while loading', async () => {
			const { container } = await render(InteractiveFlow, {
				props: choosing({ loading: true, candidate: undefined })
			});
			expect(container.textContent).toContain('Rolling…');
			expect(container.querySelector('.candidate')).toBeNull();
		});

		it('surfaces an error as an alert', async () => {
			const { container } = await render(InteractiveFlow, {
				props: choosing({ candidate: undefined, error: 'No eligible character.' })
			});
			const alert = container.querySelector('[role="alert"]');
			expect(alert?.textContent).toContain('No eligible character.');
		});
	});

	describe('disabled states', () => {
		it('disables Accept when there is no candidate', async () => {
			const { container } = await render(InteractiveFlow, {
				props: choosing({ candidate: undefined })
			});
			expect(button(container, 'Accept').disabled).toBe(true);
		});

		it('disables "Accept as main" on the final pick', async () => {
			const { container } = await render(InteractiveFlow, {
				props: choosing({ selectionState: finalPickState, currentPlayerNumber: 4 })
			});
			expect(button(container, 'Accept as main').disabled).toBe(true);
			expect(button(container, 'Accept').disabled).toBe(false);
		});

		it('disables and generically labels "Go back" before any choice', async () => {
			const { container } = await render(InteractiveFlow, { props: choosing() });
			expect(button(container, 'Go back').disabled).toBe(true);
		});

		it('labels "Go back" with the previous player once there is a choice', async () => {
			const { container } = await render(InteractiveFlow, {
				props: choosing({
					selectionState: finalPickState,
					currentPlayerNumber: 4,
					expandedNames: ['Ann', 'Bob', 'Cat']
				})
			});
			expect(button(container, 'Go back to Player 3 (Cat)').disabled).toBe(false);
		});
	});

	describe('event forwarding', () => {
		it('submitting the form asks the parent to start', async () => {
			const onstart = vi.fn();
			const { container } = await render(InteractiveFlow, { props: baseProps({ onstart }) });
			button(container, 'Start').click();
			await expect.poll(() => onstart).toHaveBeenCalledOnce();
		});

		it('Accept and "Accept as main" forward the main flag', async () => {
			const onaccept = vi.fn();
			const { container } = await render(InteractiveFlow, { props: choosing({ onaccept }) });
			button(container, 'Accept').click();
			await expect.poll(() => onaccept).toHaveBeenCalledWith(false);
			button(container, 'Accept as main').click();
			await expect.poll(() => onaccept).toHaveBeenCalledWith(true);
		});

		it('Reroll and Start over forward to the parent', async () => {
			const onreroll = vi.fn();
			const { container } = await render(InteractiveFlow, { props: choosing({ onreroll }) });
			button(container, 'Reroll').click();
			await expect.poll(() => onreroll).toHaveBeenCalledOnce();

			const onreset = vi.fn();
			const done = await render(InteractiveFlow, {
				props: baseProps({ selectionState: doneState, onreset })
			});
			button(done.container, 'Start over').click();
			await expect.poll(() => onreset).toHaveBeenCalledOnce();
		});
	});

	describe('player list editing', () => {
		it('adds an input and moves focus onto it', async () => {
			const { container } = await render(InteractiveFlow, { props: baseProps() });
			expect(container.querySelectorAll('input')).toHaveLength(1);

			button(container, 'Add player').click();

			await expect.poll(() => container.querySelectorAll('input')).toHaveLength(2);
			const inputs = [...container.querySelectorAll('input')];
			await expect.poll(() => document.activeElement === inputs[1]).toBe(true);
		});

		it('removes a row and focuses the previous input', async () => {
			const { container } = await render(InteractiveFlow, { props: baseProps() });
			button(container, 'Add player').click();
			await expect.poll(() => container.querySelectorAll('input')).toHaveLength(2);
			button(container, 'Add player').click();
			await expect.poll(() => container.querySelectorAll('input')).toHaveLength(3);

			// Remove the second player; focus should fall back to the first input.
			buttonByLabel(container, 'Remove player 2').click();

			await expect.poll(() => container.querySelectorAll('input')).toHaveLength(2);
			const inputs = [...container.querySelectorAll('input')];
			await expect.poll(() => document.activeElement === inputs[0]).toBe(true);
		});
	});

	describe('focus management', () => {
		it('moves focus to Accept after the flow starts', async () => {
			const { container, rerender } = await render(InteractiveFlow, { props: baseProps() });
			// The parent flips into the choosing view when start is invoked.
			const onstart = vi.fn(async () => {
				await rerender(choosing({ onstart }));
			});
			await rerender(baseProps({ onstart }));

			button(container, 'Start').click();

			await expect.poll(activeLabel).toBe('Accept');
		});

		it('leaves focus on Reroll — a reroll must not steal it', async () => {
			const onreroll = vi.fn(async () => {
				// A real reroll swaps the candidate; focus should stay put regardless.
				await rerender(choosing({ candidate: makeChar('Amber'), onreroll }));
			});
			const { container, rerender } = await render(InteractiveFlow, {
				props: choosing({ onreroll })
			});

			const reroll = button(container, 'Reroll');
			reroll.focus();
			reroll.click();

			await expect.poll(() => container.textContent).toContain('Amber');
			expect(activeLabel()).toBe('Reroll');
		});

		it('moves focus to Start over when the final pick completes the party', async () => {
			const onaccept = vi.fn(async () => {
				await rerender(baseProps({ selectionState: doneState, onaccept }));
			});
			const { container, rerender } = await render(InteractiveFlow, {
				props: choosing({
					selectionState: finalPickState,
					currentPlayerNumber: 4,
					candidate: makeChar('Bennett'),
					onaccept
				})
			});

			button(container, 'Accept').click();

			await expect.poll(activeLabel).toBe('Start over');
		});
	});
});

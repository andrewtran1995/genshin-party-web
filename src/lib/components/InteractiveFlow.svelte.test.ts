import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { ComponentProps } from 'svelte';
import { render } from 'vitest-browser-svelte';
import InteractiveFlow from './InteractiveFlow.svelte';
import type { Char } from '$lib/types';
import type { PartyFlowState, PlayerChoice } from '$lib/party-flow.svelte';
import type { Preset } from '$lib/player-presets';

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

const idleState: PartyFlowState = {
	status: 'idle',
	playerChoices: [],
	playerOrder: [],
	currentPlayerNumber: undefined,
	candidate: undefined,
	candidateHistory: [],
	candidateHistoryIndex: -1,
	error: ''
};

const activeState: PartyFlowState = {
	status: 'active',
	playerChoices: [],
	playerOrder: [1, 2, 3, 4],
	currentPlayerNumber: 1,
	candidate: makeChar('Furina'),
	candidateHistory: [makeChar('Furina')],
	candidateHistoryIndex: 0,
	error: ''
};

const finalPickState: PartyFlowState = {
	status: 'active',
	playerChoices: [pick(1, 'Furina'), pick(2, 'Kazuha'), pick(3, 'Nahida')],
	playerOrder: [1, 2, 3, 4],
	currentPlayerNumber: 4,
	candidate: makeChar('Bennett'),
	candidateHistory: [makeChar('Bennett')],
	candidateHistoryIndex: 0,
	error: ''
};

const doneState: PartyFlowState = {
	status: 'done',
	playerChoices: [pick(1, 'Furina'), pick(2, 'Kazuha'), pick(3, 'Nahida'), pick(4, 'Bennett')],
	playerOrder: [1, 2, 3, 4],
	currentPlayerNumber: undefined,
	candidate: undefined,
	candidateHistory: [],
	candidateHistoryIndex: -1,
	error: ''
};

type Props = ComponentProps<typeof InteractiveFlow>;

const baseProps = (overrides: Partial<Props> = {}): Props => ({
	flowState: idleState,
	expandedNames: [],
	onstart: vi.fn(),
	onaccept: vi.fn(),
	onreroll: vi.fn(),
	onpreviousroll: vi.fn(),
	onnextroll: vi.fn(),
	ongoback: vi.fn(),
	onreset: vi.fn(),
	...overrides
});

const choosing = (overrides: Partial<Props> = {}): Props =>
	baseProps({
		flowState: activeState,
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
		it('shows the player-names form when idle', async () => {
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
				props: baseProps({ flowState: doneState })
			});
			const live = container.querySelector('.visually-hidden[aria-live="polite"]');
			expect(live?.textContent).toContain('Party complete');
			expect(container.querySelectorAll('.party-result > li')).toHaveLength(4);
			expect(button(container, 'Start over')).toBeInstanceOf(HTMLButtonElement);
		});

		it('surfaces an error as an alert', async () => {
			const { container } = await render(InteractiveFlow, {
				props: choosing({
					flowState: { ...activeState, candidate: undefined, error: 'No eligible character.' }
				})
			});
			const alert = container.querySelector('[role="alert"]');
			expect(alert?.textContent).toContain('No eligible character.');
		});
	});

	describe('disabled states', () => {
		it('disables Accept when there is no candidate', async () => {
			const { container } = await render(InteractiveFlow, {
				props: choosing({ flowState: { ...activeState, candidate: undefined } })
			});
			expect(button(container, 'Accept').disabled).toBe(true);
		});

		it('disables "Accept as main" on the final pick', async () => {
			const { container } = await render(InteractiveFlow, {
				props: choosing({ flowState: finalPickState })
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
					flowState: finalPickState,
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
				props: baseProps({ flowState: doneState, onreset })
			});
			button(done.container, 'Start over').click();
			await expect.poll(() => onreset).toHaveBeenCalledOnce();
		});
	});

	describe('roll history', () => {
		it('shows the current roll position when there is history', async () => {
			const flowState: PartyFlowState = {
				...activeState,
				candidateHistory: [makeChar('Furina'), makeChar('Amber')],
				candidateHistoryIndex: 1
			};
			const { container } = await render(InteractiveFlow, {
				props: choosing({ flowState })
			});
			expect(container.textContent).toContain('Roll 2 of 2');
		});

		it('does not show a roll indicator when history is empty', async () => {
			const { container } = await render(InteractiveFlow, { props: choosing() });
			expect(container.textContent).not.toContain('Roll');
		});

		it('disables Previous roll at the first history item', async () => {
			const { container } = await render(InteractiveFlow, { props: choosing() });
			expect(buttonByLabel(container, 'Previous roll').disabled).toBe(true);
		});

		it('enables Previous roll when there is an earlier candidate', async () => {
			const flowState: PartyFlowState = {
				...activeState,
				candidateHistory: [makeChar('Furina'), makeChar('Amber')],
				candidateHistoryIndex: 1
			};
			const { container } = await render(InteractiveFlow, {
				props: choosing({ flowState })
			});
			expect(buttonByLabel(container, 'Previous roll').disabled).toBe(false);
		});

		it('disables Next roll at the last history item', async () => {
			const { container } = await render(InteractiveFlow, { props: choosing() });
			expect(buttonByLabel(container, 'Next roll').disabled).toBe(true);
		});

		it('enables Next roll when there is a later candidate', async () => {
			const flowState: PartyFlowState = {
				...activeState,
				candidateHistory: [makeChar('Furina'), makeChar('Amber')],
				candidateHistoryIndex: 0
			};
			const { container } = await render(InteractiveFlow, {
				props: choosing({ flowState })
			});
			expect(buttonByLabel(container, 'Next roll').disabled).toBe(false);
		});

		it('forwards Previous roll and Next roll to the parent', async () => {
			const onpreviousroll = vi.fn();
			const onnextroll = vi.fn();
			// A middle index in a 3-entry history so both buttons are enabled at once.
			const flowState: PartyFlowState = {
				...activeState,
				candidateHistory: [makeChar('Furina'), makeChar('Amber'), makeChar('Diluc')],
				candidateHistoryIndex: 1
			};
			const { container } = await render(InteractiveFlow, {
				props: choosing({ flowState, onpreviousroll, onnextroll })
			});
			buttonByLabel(container, 'Previous roll').click();
			await expect.poll(() => onpreviousroll).toHaveBeenCalledOnce();
			buttonByLabel(container, 'Next roll').click();
			await expect.poll(() => onnextroll).toHaveBeenCalledOnce();
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

	describe('preset pre-fill', () => {
		const presets: Preset[] = [
			{ id: 'p1', name: 'Crew', players: ['Ann', 'Bob'] },
			{ id: 'p2', name: 'Solo', players: ['Zoe'] }
		];

		it('pre-fills the form from the default preset', async () => {
			const { container } = await render(InteractiveFlow, {
				props: baseProps({ presets, defaultPresetId: 'p1' })
			});
			const values = [...container.querySelectorAll('input')].map((i) => i.value);
			expect(values).toEqual(['Ann', 'Bob']);
		});

		it('shows a blank single input when there is no default', async () => {
			const { container } = await render(InteractiveFlow, {
				props: baseProps({ presets, defaultPresetId: null })
			});
			const inputs = [...container.querySelectorAll('input')];
			expect(inputs).toHaveLength(1);
			expect(inputs[0]?.value).toBe('');
		});

		it('hides the preset picker when there are no presets', async () => {
			const { container } = await render(InteractiveFlow, { props: baseProps() });
			expect(container.querySelector('select')).toBeNull();
		});

		it('loads a different preset when picked', async () => {
			const { container } = await render(InteractiveFlow, {
				props: baseProps({ presets, defaultPresetId: 'p1' })
			});
			const select = container.querySelector('select');
			if (!select) throw new Error('No preset picker');
			select.value = 'p2';
			select.dispatchEvent(new Event('change', { bubbles: true }));

			await expect
				.poll(() => [...container.querySelectorAll('input')].map((i) => i.value))
				.toEqual(['Zoe']);
		});

		it('starts with the pre-filled names', async () => {
			const onstart = vi.fn();
			const { container } = await render(InteractiveFlow, {
				props: baseProps({ presets, defaultPresetId: 'p1', onstart })
			});
			button(container, 'Start').click();
			await expect.poll(() => onstart).toHaveBeenCalledWith(['Ann', 'Bob']);
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
				await rerender(
					choosing({ flowState: { ...activeState, candidate: makeChar('Amber') }, onreroll })
				);
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
				await rerender(baseProps({ flowState: doneState, onaccept }));
			});
			const { container, rerender } = await render(InteractiveFlow, {
				props: choosing({
					flowState: { ...finalPickState, candidate: makeChar('Bennett') },
					onaccept
				})
			});

			button(container, 'Accept').click();

			await expect.poll(activeLabel).toBe('Start over');
		});
	});

	// Enter in a name input advances the list rather than submitting, until the
	// party is full — then it falls through to the form's native submit.
	describe('Enter-to-advance in the name inputs', () => {
		const inputs = (container: HTMLElement) => [...container.querySelectorAll('input')];

		it('opens a new slot and focuses it when Enter is pressed on the last row', async () => {
			const onstart = vi.fn();
			const { container } = await render(InteractiveFlow, { props: baseProps({ onstart }) });
			expect(inputs(container)).toHaveLength(1);

			inputs(container)[0]?.focus();
			await userEvent.keyboard('{Enter}');

			await expect.poll(() => inputs(container)).toHaveLength(2);
			await expect.poll(() => document.activeElement === inputs(container)[1]).toBe(true);
			expect(onstart).not.toHaveBeenCalled();
		});

		it('moves focus to the next input when Enter is pressed on an earlier row', async () => {
			const onstart = vi.fn();
			const { container } = await render(InteractiveFlow, { props: baseProps({ onstart }) });
			button(container, 'Add player').click();
			await expect.poll(() => inputs(container)).toHaveLength(2);

			inputs(container)[0]?.focus();
			await userEvent.keyboard('{Enter}');

			// No extra slot; focus simply advances like Tab.
			await expect.poll(() => document.activeElement === inputs(container)[1]).toBe(true);
			expect(inputs(container)).toHaveLength(2);
			expect(onstart).not.toHaveBeenCalled();
		});

		it('submits instead of adding a fifth slot once the party is full', async () => {
			const onstart = vi.fn();
			const { container } = await render(InteractiveFlow, { props: baseProps({ onstart }) });
			for (let i = 0; i < 3; i++) button(container, 'Add player').click();
			await expect.poll(() => inputs(container)).toHaveLength(4);

			inputs(container).at(-1)?.focus();
			await userEvent.keyboard('{Enter}');

			await expect.poll(() => onstart).toHaveBeenCalledOnce();
			expect(inputs(container)).toHaveLength(4);
		});

		it('ignores Enter that confirms an IME composition', async () => {
			const onstart = vi.fn();
			const { container } = await render(InteractiveFlow, { props: baseProps({ onstart }) });
			const first = inputs(container)[0];
			first?.focus();
			first?.dispatchEvent(
				new KeyboardEvent('keydown', {
					key: 'Enter',
					isComposing: true,
					bubbles: true,
					cancelable: true
				})
			);

			// No slot added, no submit — the keystroke belonged to the IME.
			expect(inputs(container)).toHaveLength(1);
			expect(onstart).not.toHaveBeenCalled();
		});
	});
});

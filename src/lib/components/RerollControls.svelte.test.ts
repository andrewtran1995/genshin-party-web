import type { ComponentProps } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import RerollControls from './RerollControls.svelte';

type Props = ComponentProps<typeof RerollControls>;

const baseProps = (overrides: Partial<Props> = {}): Props => ({
	entry: '/char',
	criteria: {},
	resultLabel: 'Rolled Hu Tao',
	onreroll: vi.fn(),
	...overrides
});

const renderControls = (overrides: Partial<Props> = {}) =>
	render(RerollControls, { props: baseProps(overrides) });

const formOf = (container: HTMLElement) => {
	const form = container.querySelector('form');
	if (!(form instanceof HTMLFormElement)) throw new Error('Expected a form');
	return form;
};

const hiddenInputs = (container: HTMLElement) =>
	Object.fromEntries(
		[...container.querySelectorAll<HTMLInputElement>('input[type="hidden"]')].map((input) => [
			input.name,
			input.value
		])
	);

describe('RerollControls', () => {
	it('rerolls without submitting the form when scripting is available', async () => {
		const onreroll = vi.fn();
		const { container } = await renderControls({ onreroll });

		const form = formOf(container);
		let submitted: SubmitEvent | undefined;
		form.addEventListener('submit', (event) => {
			submitted = event;
		});

		const button = container.querySelector('.reroll');
		if (!(button instanceof HTMLElement)) throw new Error('Expected a reroll button');
		button.click();

		await expect.poll(() => onreroll).toHaveBeenCalledOnce();
		expect(submitted?.defaultPrevented).toBe(true);
	});

	it('posts to the entry form as a no-JS fallback', async () => {
		const { container } = await renderControls({ entry: '/boss' });

		const form = formOf(container);
		expect(form.getAttribute('method')).toBe('POST');
		expect(form.getAttribute('action')).toBe('/boss');
	});

	it('forwards the active criteria so a fallback reroll keeps them', async () => {
		const { container } = await renderControls({
			entry: '/boss',
			criteria: { weekly: '1', gauntlet: 'on' }
		});

		expect(hiddenInputs(container)).toEqual({ weekly: '1', gauntlet: 'on' });
	});

	it('omits empty criteria so they read as absent filters', async () => {
		const { container } = await renderControls({
			criteria: { element: 'pyro', rarity: '' }
		});

		expect(hiddenInputs(container)).toEqual({ element: 'pyro' });
	});

	it('links back to the entry form to change criteria', async () => {
		const { container } = await renderControls();

		const link = container.querySelector('.change-criteria');
		expect(link?.getAttribute('href')).toBe('/char');
	});

	it('exposes the current result to assistive technology via a live region', async () => {
		const { container } = await renderControls({ resultLabel: 'Rolled Hu Tao' });

		const liveRegion = container.querySelector('[aria-live="polite"]');
		expect(liveRegion?.textContent).toBe('Rolled Hu Tao');
	});

	it('announces a reroll by updating the live region for the new result', async () => {
		const { container, rerender } = await renderControls({ resultLabel: 'Rolled Hu Tao' });

		await rerender({ resultLabel: 'Rolled Xiao' });

		const liveRegion = container.querySelector('[aria-live="polite"]');
		expect(liveRegion?.textContent).toBe('Rolled Xiao');
	});
});

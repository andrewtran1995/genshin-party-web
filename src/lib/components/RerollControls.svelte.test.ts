import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import RerollControls from './RerollControls.svelte';

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
		const { container } = await render(RerollControls, {
			props: { entry: '/char', criteria: {}, onreroll }
		});

		const form = container.querySelector('form');
		if (!(form instanceof HTMLFormElement)) throw new Error('Expected a form');

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
		const { container } = await render(RerollControls, {
			props: { entry: '/boss', criteria: {}, onreroll: vi.fn() }
		});

		const form = container.querySelector('form');
		expect(form?.getAttribute('method')).toBe('POST');
		expect(form?.getAttribute('action')).toBe('/boss');
	});

	it('forwards the active criteria so a fallback reroll keeps them', async () => {
		const { container } = await render(RerollControls, {
			props: {
				entry: '/boss',
				criteria: { weekly: '1', gauntlet: 'on' },
				onreroll: vi.fn()
			}
		});

		expect(hiddenInputs(container)).toEqual({ weekly: '1', gauntlet: 'on' });
	});

	it('omits empty criteria so they read as absent filters', async () => {
		const { container } = await render(RerollControls, {
			props: {
				entry: '/char',
				criteria: { element: 'pyro', rarity: '' },
				onreroll: vi.fn()
			}
		});

		expect(hiddenInputs(container)).toEqual({ element: 'pyro' });
	});

	it('links back to the entry form to change criteria', async () => {
		const { container } = await render(RerollControls, {
			props: { entry: '/char', criteria: {}, onreroll: vi.fn() }
		});

		const link = container.querySelector('.change-criteria');
		expect(link?.getAttribute('href')).toBe('/char');
	});
});

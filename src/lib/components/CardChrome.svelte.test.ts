import { afterEach, describe, expect, it } from 'vitest';
import { commands, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import CharCard from './CharCard.svelte';
import type { Char } from '$lib/types';

const PIXEL =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const makeChar = (overrides: Partial<Char> = {}): Char => ({
	id: 1,
	name: 'Furina',
	title: 'Endless Solo of Solitude',
	rarity: 5,
	element: 'hydro',
	elementText: 'Hydro',
	weaponText: 'Sword',
	region: 'Fontaine',
	portrait: PIXEL,
	icon: PIXEL,
	...overrides
});

const cardInner = (container: HTMLElement) => {
	const inner = container.querySelector<HTMLElement>('.card-inner');
	if (!inner) throw new Error('Expected .card-inner');
	return inner;
};

// `prefers-reduced-motion` is a real CSS media query — emulated for the whole
// page via the `setReducedMotion` command (vitest.browser.config.ts), not
// stubbed in JS — so reset it after every test rather than leaking it into
// whichever test runs next.
afterEach(async () => {
	await commands.setReducedMotion(false);
});

describe('CardChrome under prefers-reduced-motion', () => {
	it('tilts toward the pointer when motion is not reduced', async () => {
		const { container } = await render(CharCard, { props: { char: makeChar() } });
		await userEvent.hover(cardInner(container));

		await expect.poll(() => getComputedStyle(cardInner(container)).transform).not.toBe('none');
	});

	it('stays flat under the pointer when reduced motion is preferred', async () => {
		await commands.setReducedMotion(true);
		const { container } = await render(CharCard, { props: { char: makeChar() } });
		await userEvent.hover(cardInner(container));

		// There's nothing to poll for here — a reduced-motion card should never
		// start tilting, so give any (unwanted) transition a moment to kick in
		// before asserting it didn't.
		await new Promise((resolve) => setTimeout(resolve, 100));
		expect(getComputedStyle(cardInner(container)).transform).toBe('none');
	});

	it('plays the wish-splash entrance when motion is not reduced', async () => {
		const { container } = await render(CharCard, { props: { char: makeChar(), reveal: true } });
		expect(getComputedStyle(cardInner(container)).animationName).toMatch(/reveal-in$/);
	});

	it('fades in instead of playing the wish-splash entrance under reduced motion', async () => {
		await commands.setReducedMotion(true);
		const { container } = await render(CharCard, { props: { char: makeChar(), reveal: true } });
		expect(getComputedStyle(cardInner(container)).animationName).toMatch(/reveal-fade$/);
	});
});

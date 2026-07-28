import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CharCard from './CharCard.svelte';
import type { Char } from '$lib/types';

// A 1x1 transparent PNG that actually decodes in the browser, so the card's
// load/error effect settles on the "art shown" path instead of the fallback.
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
	fandomUrl: undefined,
	...overrides
});

describe('CharCard', () => {
	it('renders the name, element and weapon typeline', async () => {
		const { container } = await render(CharCard, { props: { char: makeChar() } });
		expect(container.textContent).toContain('Furina');
		expect(container.textContent).toContain('Hydro');
		expect(container.textContent).toContain('Sword');
	});

	it('shows one star per rarity point with an accessible label', async () => {
		const { container } = await render(CharCard, { props: { char: makeChar({ rarity: 4 }) } });
		const stars = container.querySelector('.card-stars');
		expect(stars?.textContent.trim()).toBe('★★★★');
		expect(stars?.getAttribute('aria-label')).toBe('4-star');
	});

	it('exposes rarity and element as data attributes for element/rarity theming', async () => {
		const { container } = await render(CharCard, {
			props: { char: makeChar({ rarity: 5, element: 'pyro' }) }
		});
		const card = container.querySelector('.card');
		expect(card?.getAttribute('data-rarity')).toBe('5');
		expect(card?.getAttribute('data-element')).toBe('pyro');
	});

	it('shows the title and region plate when present', async () => {
		const { container } = await render(CharCard, { props: { char: makeChar() } });
		const plate = container.querySelector('.card-plate');
		expect(plate).not.toBeNull();
		expect(plate?.textContent).toContain('Endless Solo of Solitude');
		expect(plate?.textContent).toContain('Fontaine');
	});

	it('omits the plate when there is no title or region (e.g. the Traveler)', async () => {
		const { container } = await render(CharCard, {
			props: { char: makeChar({ title: '', region: '' }) }
		});
		expect(container.querySelector('.card-plate')).toBeNull();
	});

	it('forwards the loading strategy to the art image', async () => {
		const { container } = await render(CharCard, {
			props: { char: makeChar(), loading: 'eager' }
		});
		const img = container.querySelector('.card-art');
		await expect.poll(() => img?.getAttribute('loading')).toBe('eager');
	});

	it('defaults to lazy-loading the art image', async () => {
		const { container } = await render(CharCard, { props: { char: makeChar() } });
		const img = container.querySelector('.card-art');
		await expect.poll(() => img?.getAttribute('loading')).toBe('lazy');
	});

	it('renders a portrait as cover art, but floats a square icon fallback', async () => {
		const { container: portraitContainer } = await render(CharCard, {
			props: { char: makeChar({ portrait: PIXEL }) }
		});
		await expect
			.poll(() =>
				portraitContainer.querySelector('.card-art')?.classList.contains('card-art-floating')
			)
			.toBe(false);

		const { container: iconContainer } = await render(CharCard, {
			props: { char: makeChar({ portrait: undefined, icon: PIXEL }) }
		});
		await expect
			.poll(() => iconContainer.querySelector('.card-art')?.classList.contains('card-art-floating'))
			.toBe(true);
	});

	it('falls back to a placeholder when the character has no image', async () => {
		const { container } = await render(CharCard, {
			props: { char: makeChar({ portrait: undefined, icon: undefined }) }
		});
		expect(container.querySelector('.card-art')).toBeNull();
		expect(container.querySelector('.card-placeholder')).not.toBeNull();
		expect(container.textContent).toContain('Art unavailable');
	});

	it('adds the reveal entrance class only when reveal is set', async () => {
		const { container: plain } = await render(CharCard, { props: { char: makeChar() } });
		expect(plain.querySelector('.card')?.classList.contains('card-reveal')).toBe(false);

		const { container: revealed } = await render(CharCard, {
			props: { char: makeChar(), reveal: true }
		});
		expect(revealed.querySelector('.card')?.classList.contains('card-reveal')).toBe(true);
	});

	it('defaults to the normal variant with no badge', async () => {
		const { container } = await render(CharCard, { props: { char: makeChar() } });
		const card = container.querySelector('.card');
		expect(card?.getAttribute('data-variant')).toBe('normal');
		expect(container.querySelector('.card-variant-badge')).toBeNull();
	});

	it('shows a badge naming the rolled variant', async () => {
		const { container } = await render(CharCard, {
			props: { char: makeChar(), variant: 'reverse-holo' }
		});
		const card = container.querySelector('.card');
		expect(card?.getAttribute('data-variant')).toBe('reverse-holo');
		expect(container.querySelector('.card-variant-badge')?.textContent.trim()).toBe('Reverse Holo');
	});

	it('re-derives name and stars when a reroll swaps in a new character', async () => {
		const { container, rerender } = await render(CharCard, {
			props: { char: makeChar({ name: 'Furina', rarity: 5 }) }
		});
		expect(container.textContent).toContain('Furina');

		await rerender({ char: makeChar({ name: 'Amber', rarity: 4 }) });

		await expect.poll(() => container.textContent).toContain('Amber');
		expect(container.querySelector('.card-stars')?.textContent.trim()).toBe('★★★★');
	});
});

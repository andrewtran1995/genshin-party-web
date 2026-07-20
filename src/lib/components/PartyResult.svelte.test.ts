import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PartyResult from './PartyResult.svelte';
import type { Char } from '$lib/types';
import type { PlayerChoice } from '$lib/party-flow.svelte';

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

const choice = (number: number, name: string, isMain = false): PlayerChoice => ({
	char: makeChar(name),
	isMain,
	number
});

// The player label is the li's direct-child h3; a CharCard renders its own
// (deeper) h3.card-name, so scope to the direct child to read only the labels.
const headings = (container: HTMLElement) =>
	[...container.querySelectorAll<HTMLElement>('.party-result > li > h3')].map((h) =>
		h.textContent.trim()
	);

describe('PartyResult', () => {
	it('renders one entry per choice, in the order given', async () => {
		const choices = [choice(1, 'Furina'), choice(2, 'Kazuha'), choice(3, 'Nahida')];
		const { container } = await render(PartyResult, {
			props: { choices, names: [] }
		});

		expect(container.querySelectorAll('.party-result > li')).toHaveLength(3);
		expect(headings(container)).toEqual(['Player 1', 'Player 2', 'Player 3']);
	});

	it('labels each entry with the player name when one was given', async () => {
		const choices = [choice(1, 'Furina'), choice(2, 'Kazuha')];
		const { container } = await render(PartyResult, {
			props: { choices, names: ['Ann', ''] }
		});

		expect(headings(container)).toEqual(['Player 1 (Ann)', 'Player 2']);
	});

	it('marks only the main pick with a Main tag', async () => {
		const choices = [choice(1, 'Furina'), choice(2, 'Kazuha', true), choice(3, 'Nahida')];
		const { container } = await render(PartyResult, {
			props: { choices, names: [] }
		});

		const tags = container.querySelectorAll('.main-tag');
		expect(tags).toHaveLength(1);

		const mainItem = tags[0]?.closest('li');
		expect(mainItem?.querySelector('h3')?.textContent.trim()).toBe('Player 2');
	});

	it('renders a character card for each choice', async () => {
		const choices = [choice(1, 'Furina'), choice(2, 'Kazuha')];
		const { container } = await render(PartyResult, {
			props: { choices, names: [] }
		});

		expect(container.textContent).toContain('Furina');
		expect(container.textContent).toContain('Kazuha');
	});

	it('renders nothing but the list shell for an empty party', async () => {
		const { container } = await render(PartyResult, {
			props: { choices: [], names: [] }
		});

		expect(container.querySelector('.party-result')).not.toBeNull();
		expect(container.querySelectorAll('.party-result > li')).toHaveLength(0);
	});
});

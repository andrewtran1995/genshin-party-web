import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import BossCard from './BossCard.svelte';

const shortBoss = {
	name: 'Hydro Slime',
	description: 'A small slime that deals Hydro DMG.',
	categoryType: 'BOSS',
	enemyType: 'BOSS',
	icon: undefined
};

const overflowingBoss = {
	name: 'Childe',
	description:
		'"Childe" Tartaglia, Eleventh of the Fatui Harbingers. He draws power from the ominous Delusion he possesses and fights using martial arts that he learned in a land of darkness. He is a pure warrior with an insatiable lust for battle. Each bloody conflict, each life-and-death struggle is a delightful trial to him.',
	categoryType: 'CODEX_SUBTYPE_BOSS',
	enemyType: 'BOSS',
	icon: undefined
};

describe('BossCard', () => {
	it('renders the boss name and category', async () => {
		const { container } = await render(BossCard, { props: { boss: overflowingBoss } });
		expect(container.textContent).toContain('Childe');
		expect(container.textContent).toContain('Weekly boss');
	});

	it('clamps the description and shows the shadow only when overflowing', async () => {
		const { container } = await render(BossCard, { props: { boss: overflowingBoss } });
		const flavor = container.querySelector('.card-flavor');
		expect(flavor).not.toBeNull();
		await expect.poll(() => flavor?.classList.contains('is-clamped')).toBe(true);
		await expect.poll(() => flavor?.classList.contains('has-overflow')).toBe(true);
	});

	it('does not show the shadow or show more button when the description fits', async () => {
		const { container } = await render(BossCard, { props: { boss: shortBoss } });
		const flavor = container.querySelector('.card-flavor');
		expect(flavor).not.toBeNull();
		await expect.poll(() => flavor?.classList.contains('has-overflow')).toBe(false);
		expect(container.textContent).not.toContain('Show more');
	});

	it('gives a short description the same collapsed footprint as a clamped one', async () => {
		const { container: fitContainer } = await render(BossCard, { props: { boss: shortBoss } });
		const { container: overflowContainer } = await render(BossCard, {
			props: { boss: overflowingBoss }
		});

		const plateOf = (container: HTMLElement) => {
			const plate = container.querySelector('.card-plate');
			if (!(plate instanceof HTMLElement)) throw new Error('Expected a card plate');
			return plate;
		};
		const flavorOf = (container: HTMLElement) => {
			const flavor = container.querySelector('.card-flavor');
			if (!(flavor instanceof HTMLElement)) throw new Error('Expected a card flavor');
			return flavor;
		};

		// The clamped card is the tall one; the short card must be padded up to match,
		// both in its text box and in the row reserved for the expand button.
		await expect
			.poll(() => flavorOf(fitContainer).clientHeight)
			.toBe(flavorOf(overflowContainer).clientHeight);
		await expect
			.poll(() => plateOf(fitContainer).offsetHeight)
			.toBe(plateOf(overflowContainer).offsetHeight);
	});

	// A reroll swaps the boss on a reused component instance. The clamped box is a
	// fixed height, so it never resizes and the ResizeObserver alone won't notice.
	it('re-measures overflow when a reroll swaps in a new boss', async () => {
		const { container, rerender } = await render(BossCard, { props: { boss: shortBoss } });
		await expect.poll(() => container.textContent).not.toContain('Show more');

		await rerender({ boss: overflowingBoss });

		await expect.poll(() => container.textContent).toContain('Show more');
	});

	it('collapses an expanded description when a reroll swaps in a new boss', async () => {
		const { container, rerender } = await render(BossCard, { props: { boss: overflowingBoss } });

		const button = container.querySelector('.card-expand');
		if (!(button instanceof HTMLElement)) throw new Error('Expected an expand button');
		button.click();
		await expect.poll(() => container.textContent).toContain('Show less');

		await rerender({ boss: { ...overflowingBoss, name: 'Azhdaha' } });

		await expect.poll(() => container.textContent).toContain('Show more');
		await expect
			.poll(() => container.querySelector('.card-flavor')?.classList.contains('is-clamped'))
			.toBe(true);
	});

	it('shows the show more button only when overflowing', async () => {
		const { container: overflowContainer } = await render(BossCard, {
			props: { boss: overflowingBoss }
		});
		await expect.poll(() => overflowContainer.textContent.includes('Show more')).toBe(true);

		const { container: fitContainer } = await render(BossCard, { props: { boss: shortBoss } });
		expect(fitContainer.textContent).not.toContain('Show more');
	});

	it('expands the description and hides the shadow when show more is clicked', async () => {
		const { container } = await render(BossCard, { props: { boss: overflowingBoss } });
		const flavor = container.querySelector('.card-flavor');
		await expect.poll(() => flavor?.classList.contains('has-overflow')).toBe(true);

		const button = container.querySelector('.card-expand');
		if (!(button instanceof HTMLElement)) {
			throw new Error('Expected expand button to be an HTMLElement');
		}
		button.click();

		await expect.poll(() => flavor?.classList.contains('is-expanded')).toBe(true);
		await expect.poll(() => flavor?.classList.contains('has-overflow')).toBe(false);
	});
});

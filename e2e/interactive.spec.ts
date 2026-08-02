import { expect, test } from './fixtures';

test('interactive flow completes four selections', async ({ page, interactive }) => {
	await interactive.goto();

	await test.step('fill in four players and start', async () => {
		await interactive.start(['A', 'B', 'C', 'D']);
	});

	await test.step('accept all four candidates', async () => {
		await interactive.accept(4);
	});

	await expect(interactive.chosenCharactersHeading).toBeVisible();
	await expect(page.getByText(/Player 1 \(A\)/)).toBeVisible();
	await expect(page.getByText(/Player 2 \(B\)/)).toBeVisible();
	await expect(page.getByText(/Player 3 \(C\)/)).toBeVisible();
	await expect(page.getByText(/Player 4 \(D\)/)).toBeVisible();
});

test('one player controls all four characters', async ({ page, interactive }) => {
	await interactive.goto();
	await interactive.start(['Solo']);
	await interactive.accept(4);

	await expect(interactive.chosenCharactersHeading).toBeVisible();
	await expect(page.getByText(/Player 1 \(Solo\)/)).toBeVisible();
	await expect(page.getByText(/Player 2 \(Solo\)/)).toBeVisible();
	await expect(page.getByText(/Player 3 \(Solo\)/)).toBeVisible();
	await expect(page.getByText(/Player 4 \(Solo\)/)).toBeVisible();
});

test('accepting a main forces the next roll to be 4-star', async ({ interactive }) => {
	await interactive.goto();
	await interactive.start();

	await expect(interactive.candidateRarityLabel('5-star')).toBeVisible();
	await interactive.acceptAsMain();

	await expect(interactive.candidateRarityLabel('4-star')).toBeVisible();
});

test('reroll shows a different candidate', async ({ interactive }) => {
	await interactive.goto();
	await interactive.start();

	const first = await interactive.candidateName();
	await interactive.reroll();

	await expect.poll(async () => await interactive.candidateName()).not.toBe(first);
});

test('going back re-offers the previous character', async ({ interactive }) => {
	await interactive.goto();
	await interactive.start();

	await interactive.accept();
	const second = await interactive.candidateName();
	await interactive.accept();

	await interactive.goBack();
	await expect(interactive.candidateHeading).toHaveText(second ?? '');
});

test('accept as main is disabled on the final pick', async ({ interactive }) => {
	await interactive.goto();
	await interactive.start();
	await interactive.accept(3);

	await expect(interactive.acceptAsMainButton).toBeDisabled();
});

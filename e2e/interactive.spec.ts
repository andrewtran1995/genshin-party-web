import { expect, test } from '@playwright/test';

test('interactive flow completes four selections', async ({ page }) => {
	await page.goto('/interactive');
	await expect(page.getByRole('heading', { name: /interactive party selection/i })).toBeVisible();

	await page.getByRole('textbox', { name: /player 1/i }).fill('A');
	await page.getByRole('button', { name: /^add player$/i }).click();
	await page.getByRole('textbox', { name: /player 2/i }).fill('B');
	await page.getByRole('button', { name: /^add player$/i }).click();
	await page.getByRole('textbox', { name: /player 3/i }).fill('C');
	await page.getByRole('button', { name: /^add player$/i }).click();
	await page.getByRole('textbox', { name: /player 4/i }).fill('D');
	await page.getByRole('button', { name: /^start$/i }).click();

	for (let i = 0; i < 4; i++) {
		await expect(page.getByText(/now choosing for/i)).toBeVisible();
		await page.getByRole('button', { name: /^accept$/i }).click();
	}

	await expect(page.getByRole('heading', { name: /chosen characters/i })).toBeVisible();
	await expect(page.getByText(/Player 1 \(A\)/)).toBeVisible();
	await expect(page.getByText(/Player 2 \(B\)/)).toBeVisible();
	await expect(page.getByText(/Player 3 \(C\)/)).toBeVisible();
	await expect(page.getByText(/Player 4 \(D\)/)).toBeVisible();
});

test('one player controls all four characters', async ({ page }) => {
	await page.goto('/interactive');
	await expect(page.getByRole('heading', { name: /interactive party selection/i })).toBeVisible();

	await page.getByRole('textbox', { name: /player 1/i }).fill('Solo');
	await page.getByRole('button', { name: /^start$/i }).click();

	for (let i = 0; i < 4; i++) {
		await expect(page.getByText(/now choosing for/i)).toBeVisible();
		await page.getByRole('button', { name: /^accept$/i }).click();
	}

	await expect(page.getByRole('heading', { name: /chosen characters/i })).toBeVisible();
	await expect(page.getByText(/Player 1 \(Solo\)/)).toBeVisible();
	await expect(page.getByText(/Player 2 \(Solo\)/)).toBeVisible();
	await expect(page.getByText(/Player 3 \(Solo\)/)).toBeVisible();
	await expect(page.getByText(/Player 4 \(Solo\)/)).toBeVisible();
});

test('accepting a main forces the next roll to be 4-star', async ({ page }) => {
	await page.goto('/interactive');
	await page.getByRole('button', { name: /^start$/i }).click();

	await expect(page.locator('.char-card').getByText('5★')).toBeVisible();
	await page.getByRole('button', { name: /accept as main/i }).click();

	await expect(page.locator('.char-card').getByText('4★')).toBeVisible();
});

test('reroll shows a different candidate', async ({ page }) => {
	await page.goto('/interactive');
	await page.getByRole('button', { name: /^start$/i }).click();

	const first = await page.locator('.char-card strong').textContent();
	await page.getByRole('button', { name: /^reroll$/i }).click();

	await expect
		.poll(async () => await page.locator('.char-card strong').textContent())
		.not.toBe(first);
});

test('going back re-offers the previous character', async ({ page }) => {
	await page.goto('/interactive');
	await page.getByRole('button', { name: /^start$/i }).click();

	await page.getByRole('button', { name: /^accept$/i }).click();
	const second = await page.locator('.char-card strong').textContent();
	await page.getByRole('button', { name: /^accept$/i }).click();

	await page.getByRole('button', { name: /^go back/i }).click();
	await expect(page.locator('.char-card strong')).toHaveText(second ?? '');
});

test('accept as main is disabled on the final pick', async ({ page }) => {
	await page.goto('/interactive');
	await page.getByRole('button', { name: /^start$/i }).click();

	for (let i = 0; i < 3; i++) {
		await page.getByRole('button', { name: /^accept$/i }).click();
	}

	await expect(page.getByRole('button', { name: /accept as main/i })).toBeDisabled();
});

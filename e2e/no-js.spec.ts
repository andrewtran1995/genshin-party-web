import { expect, test } from './fixtures';

// These pages ship a `+page.server.ts` form action specifically as a no-JS
// fallback (see AGENTS.md). Every other spec exercises the client-side
// `handleSubmit` path instead; this file is the only coverage for the real
// POST -> redirect(303) path those actions implement.
test.use({ javaScriptEnabled: false });

test('char roll falls back to a real form POST without JS', async ({ page }) => {
	await page.goto('/char');
	await page.getByRole('button', { name: /^roll$/i }).click();

	await expect(page).toHaveURL(/\/char\/[^/?]+(\?.*)?$/);
	await expect(page.getByRole('heading', { name: /random character/i })).toBeVisible();
});

test('char debug form falls back to a real POST with the allVariants flag', async ({ page }) => {
	await page.goto('/char');
	await page.getByLabel('Character:').selectOption('Amber');
	await page.getByRole('button', { name: /^show all variants$/i }).click();

	await expect(page).toHaveURL(/\/char\/Amber\?allVariants=1/);
});

test.describe('validation failures', () => {
	// A form action's fail() response is a real non-2xx status, which Chrome
	// logs as a "Failed to load resource" console error on the navigation —
	// expected here, not a bug the consoleErrors fixture should catch.
	test.use({ expectedConsoleErrors: [/failed to load resource.*status of (404|400)/i] });

	// The Traveler ("none" element) has no 4-star entry, so this combo is a real
	// filter with zero matches — the same `fail()` the client-side roll would hit.
	test('char roll renders the no-JS action failure for an empty filter combo', async ({ page }) => {
		await page.goto('/char');
		await page.getByLabel('Element:').selectOption('none');
		await page.getByLabel('Rarity:').selectOption('4');
		await page.getByRole('button', { name: /^roll$/i }).click();

		await expect(page.getByRole('alert')).toHaveText('No character matches those filters.');
	});

	test('char debug form renders the no-JS action failure with no character selected', async ({
		page
	}) => {
		await page.goto('/char');
		await page.getByRole('button', { name: /^show all variants$/i }).click();

		await expect(page.getByRole('alert')).toHaveText('Select a valid character.');
	});
});

test('boss roll falls back to a real form POST without JS', async ({ page }) => {
	await page.goto('/boss');
	await page.getByRole('button', { name: /^roll$/i }).click();

	await expect(page).toHaveURL(/\/boss\/[^/?]+(\?.*)?$/);
	await expect(page.getByRole('heading', { name: /random boss/i })).toBeVisible();
});

test('order shuffle falls back to a real form POST without JS', async ({ page }) => {
	await page.goto('/order');
	await page.getByRole('button', { name: /^shuffle$/i }).click();

	await expect(page).toHaveURL(/\/order\/\d,\d,\d,\d$/);
});

import { expect, test } from '@playwright/test';

test('home page renders the feature list', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('genshin-party');

	const main = page.getByRole('main');
	await expect(main.getByRole('link', { name: /random character/i })).toBeVisible();
	await expect(main.getByRole('link', { name: /random boss/i })).toBeVisible();
	await expect(main.getByRole('link', { name: /random order/i })).toBeVisible();
	await expect(main.getByRole('link', { name: /interactive party/i })).toBeVisible();
});

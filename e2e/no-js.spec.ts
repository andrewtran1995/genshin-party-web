import { expect, test } from './fixtures';

// These pages ship a `+page.server.ts` form action specifically as a no-JS
// fallback (see AGENTS.md). Every other spec exercises the client-side
// `handleSubmit` path instead; this file is the only coverage for the real
// POST -> redirect(303) path those actions implement.
test.use({ javaScriptEnabled: false });

test('char roll falls back to a real form POST without JS', async ({ page }) => {
	await page.goto('/char');
	await page.getByRole('button', { name: /^roll$/i }).click();

	await expect(page).toHaveURL(/\/char\/[^/?]+$/);
	await expect(page.getByRole('heading', { name: /random character/i })).toBeVisible();
});

test('boss roll falls back to a real form POST without JS', async ({ page }) => {
	await page.goto('/boss');
	await page.getByRole('button', { name: /^roll$/i }).click();

	await expect(page).toHaveURL(/\/boss\/[^/?]+(\?.*)?$/);
});

test('order shuffle falls back to a real form POST without JS', async ({ page }) => {
	await page.goto('/order');
	await page.getByRole('button', { name: /^shuffle$/i }).click();

	await expect(page).toHaveURL(/\/order\/\d,\d,\d,\d$/);
});

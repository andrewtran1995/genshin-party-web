import { expect, test } from './fixtures';

test('home page renders the feature list', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('genshin-party');

	const main = page.getByRole('main');
	await expect(main.getByRole('link', { name: /random character/i })).toBeVisible();
	await expect(main.getByRole('link', { name: /random boss/i })).toBeVisible();
	await expect(main.getByRole('link', { name: /random order/i })).toBeVisible();
	await expect(main.getByRole('link', { name: /interactive party/i })).toBeVisible();
});

test('rerolling a character keeps the filters that produced it', async ({ page }) => {
	await page.goto('/char');
	await page.getByLabel('Element:').selectOption('pyro');
	await page.getByRole('button', { name: /^roll$/i }).click();

	await expect(page).toHaveURL(/\/char\/[^?]+\?element=pyro/);
	await expect(page.getByText('Filters: Pyro')).toBeVisible();

	await page.getByRole('button', { name: /^reroll$/i }).click();

	await expect(page).toHaveURL(/\/char\/[^?]+\?element=pyro/);
	await expect(page.getByText('Filters: Pyro')).toBeVisible();
});

test('changing criteria returns to the entry form', async ({ page }) => {
	await page.goto('/order');
	await page.getByRole('button', { name: /^shuffle$/i }).click();
	await expect(page).toHaveURL(/\/order\/\d,\d,\d,\d/);

	await page.getByRole('link', { name: /change criteria/i }).click();
	await expect(page).toHaveURL(/\/order$/);
});

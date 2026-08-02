import { expect, test } from './fixtures';

// These tests opt into the `seededRandom` fixture (see e2e/fixtures.ts), which
// pins Math.random in the browser so client-side rolls are reproducible. Only
// the client-side path (JS enabled, form intercepted by handleSubmit) is
// affected — server-side rolls are covered separately in no-js.spec.ts.
// `mockCharArt` swaps the rolled character's (real, third-party-hosted) art
// for a local placeholder so these tests don't depend on those CDNs.
test('same seed rolls the same character for the same filters', async ({
	page,
	seededRandom,
	mockCharArt
}) => {
	void seededRandom;
	void mockCharArt;

	await page.goto('/char');
	await page.getByLabel('Element:').selectOption('pyro');
	await page.getByRole('button', { name: /^roll$/i }).click();
	await expect(page).toHaveURL(/\/char\/[^?]+\?element=pyro/);
	const firstUrl = page.url();

	await page.goto('/char');
	await page.getByLabel('Element:').selectOption('pyro');
	await page.getByRole('button', { name: /^roll$/i }).click();
	await expect(page).toHaveURL(/\/char\/[^?]+\?element=pyro/);

	expect(page.url()).toBe(firstUrl);
});

test('debug form renders all card variants for a chosen character', async ({ page }) => {
	await page.goto('/char');
	await page.getByLabel('Character:').selectOption('Amber');
	await page.getByRole('button', { name: /^show all variants$/i }).click();

	await expect(page).toHaveURL(/\/char\/Amber\?allVariants=1/);
	await expect(page.getByRole('heading', { name: /all card variants/i })).toBeVisible();
	await expect(page.getByRole('article')).toHaveCount(4);
	for (const variant of ['normal', 'holo', 'reverse-holo', 'foil']) {
		await expect(page.locator(`article[data-variant="${variant}"]`)).toBeVisible();
	}
	for (const label of ['Normal', 'Holo', 'Reverse Holo', 'Foil']) {
		await expect(
			page.locator('.variant-label', { hasText: new RegExp(`^${label}$`) })
		).toBeVisible();
	}
});

import { expect, test } from './fixtures';

test.describe('default preset seeds the interactive form', () => {
	test.use({
		presets: {
			presets: [{ id: 'preset-1', name: 'Weeknight crew', players: ['Ann', 'Bo', 'Cy'] }],
			defaultId: 'preset-1'
		}
	});

	test('interactive form pre-fills from the default preset', async ({ page, interactive }) => {
		await interactive.goto();

		await expect(page.getByRole('combobox', { name: /load a saved party/i })).toHaveValue(
			'preset-1'
		);
		await expect(page.getByRole('textbox', { name: /player 1/i })).toHaveValue('Ann');
		await expect(page.getByRole('textbox', { name: /player 2/i })).toHaveValue('Bo');
		await expect(page.getByRole('textbox', { name: /player 3/i })).toHaveValue('Cy');
	});
});

test('saving a preset on settings and setting it default seeds interactive', async ({ page }) => {
	await page.goto('/settings');

	await page.getByRole('textbox', { name: /preset name/i }).fill('From settings');
	await page.getByRole('textbox', { name: /player 1/i }).fill('Deeley');
	await page.getByRole('button', { name: /^add preset$/i }).click();

	await page.getByRole('radio', { name: /set from settings as default/i }).check();

	await page.goto('/interactive');
	await expect(page.getByRole('textbox', { name: /player 1/i })).toHaveValue('Deeley');
});

test('corrupt localStorage preset data does not break the interactive page', async ({ page }) => {
	await page.addInitScript(() => {
		window.localStorage.setItem('genshin-party:presets:v1', 'not json{{{');
	});
	await page.goto('/interactive');

	await expect(page.getByRole('heading', { name: /interactive party selection/i })).toBeVisible();
	await expect(page.getByRole('combobox', { name: /load a saved party/i })).toHaveCount(0);
	await expect(page.getByRole('textbox', { name: /player 1/i })).toHaveValue('');
});

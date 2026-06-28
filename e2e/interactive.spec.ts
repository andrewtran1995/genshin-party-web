import { expect, test } from '@playwright/test';
import type { Char } from '../src/lib/types';

const mockChars: Char[] = [
	{
		id: 1,
		name: 'MockFiveA',
		title: '',
		rarity: 5,
		element: 'pyro',
		elementText: 'Pyro',
		weaponText: 'Sword',
		region: 'Mondstadt',
		portrait: null,
		icon: null,
		fandomUrl: null
	},
	{
		id: 2,
		name: 'MockFiveB',
		title: '',
		rarity: 5,
		element: 'cryo',
		elementText: 'Cryo',
		weaponText: 'Bow',
		region: 'Mondstadt',
		portrait: null,
		icon: null,
		fandomUrl: null
	},
	{
		id: 3,
		name: 'MockFiveC',
		title: '',
		rarity: 5,
		element: 'geo',
		elementText: 'Geo',
		weaponText: 'Claymore',
		region: 'Liyue',
		portrait: null,
		icon: null,
		fandomUrl: null
	},
	{
		id: 4,
		name: 'MockFiveD',
		title: '',
		rarity: 5,
		element: 'electro',
		elementText: 'Electro',
		weaponText: 'Polearm',
		region: 'Inazuma',
		portrait: null,
		icon: null,
		fandomUrl: null
	},
	{
		id: 5,
		name: 'MockFourA',
		title: '',
		rarity: 4,
		element: 'hydro',
		elementText: 'Hydro',
		weaponText: 'Catalyst',
		region: 'Liyue',
		portrait: null,
		icon: null,
		fandomUrl: null
	},
	{
		id: 6,
		name: 'MockFourB',
		title: '',
		rarity: 4,
		element: 'anemo',
		elementText: 'Anemo',
		weaponText: 'Sword',
		region: 'Mondstadt',
		portrait: null,
		icon: null,
		fandomUrl: null
	},
	{
		id: 7,
		name: 'MockFourC',
		title: '',
		rarity: 4,
		element: 'dendro',
		elementText: 'Dendro',
		weaponText: 'Bow',
		region: 'Sumeru',
		portrait: null,
		icon: null,
		fandomUrl: null
	},
	{
		id: 8,
		name: 'MockFourD',
		title: '',
		rarity: 4,
		element: 'pyro',
		elementText: 'Pyro',
		weaponText: 'Claymore',
		region: 'Natlan',
		portrait: null,
		icon: null,
		fandomUrl: null
	}
];

const setupMockApi = async (page: import('@playwright/test').Page) => {
	const requestCounts = new Map<string, number>();
	await page.route('/api/random-char*', async (route) => {
		const url = new URL(route.request().url());
		const rarity = url.searchParams.get('rarity') ?? 'any';
		const exclude = (url.searchParams.get('exclude') ?? '')
			.split(',')
			.map((name) => name.trim())
			.filter(Boolean)
			.sort()
			.join(',');
		const key = `${rarity}:${exclude}`;
		const count = requestCounts.get(key) ?? 0;
		requestCounts.set(key, count + 1);

		const excludeSet = new Set(exclude.split(',').filter(Boolean));
		const pool = mockChars.filter(
			(char) => !excludeSet.has(char.name) && (rarity === 'any' || String(char.rarity) === rarity)
		);
		const char = pool[count % Math.max(pool.length, 1)];
		if (!char) {
			await route.fulfill({
				status: 404,
				body: JSON.stringify({ error: 'No eligible character.' })
			});
			return;
		}
		await route.fulfill({ body: JSON.stringify(char) });
	});
};

test('interactive flow completes four selections', async ({ page }) => {
	await page.goto('/interactive');
	await expect(page.getByRole('heading', { name: /interactive party selection/i })).toBeVisible();

	await setupMockApi(page);
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
	await expect(page.getByText(/Player 1 \(A\):/)).toBeVisible();
	await expect(page.getByText(/Player 2 \(B\):/)).toBeVisible();
	await expect(page.getByText(/Player 3 \(C\):/)).toBeVisible();
	await expect(page.getByText(/Player 4 \(D\):/)).toBeVisible();
});

test('one player controls all four characters', async ({ page }) => {
	await page.goto('/interactive');
	await expect(page.getByRole('heading', { name: /interactive party selection/i })).toBeVisible();

	await setupMockApi(page);
	await page.getByRole('textbox', { name: /player 1/i }).fill('Solo');
	await page.getByRole('button', { name: /^start$/i }).click();

	for (let i = 0; i < 4; i++) {
		await expect(page.getByText(/now choosing for/i)).toBeVisible();
		await page.getByRole('button', { name: /^accept$/i }).click();
	}

	await expect(page.getByRole('heading', { name: /chosen characters/i })).toBeVisible();
	await expect(page.getByText(/Player 1 \(Solo\):/)).toBeVisible();
	await expect(page.getByText(/Player 2 \(Solo\):/)).toBeVisible();
	await expect(page.getByText(/Player 3 \(Solo\):/)).toBeVisible();
	await expect(page.getByText(/Player 4 \(Solo\):/)).toBeVisible();
});

test('accepting a main forces the next roll to be 4-star', async ({ page }) => {
	await page.goto('/interactive');
	await setupMockApi(page);
	await page.getByRole('button', { name: /^start$/i }).click();

	await expect(page.getByText('MockFiveA')).toBeVisible();
	await page.getByRole('button', { name: /accept as main/i }).click();

	await expect(page.getByText('MockFourA')).toBeVisible();
});

test('reroll fetches a different candidate', async ({ page }) => {
	await page.goto('/interactive');
	await setupMockApi(page);
	await page.getByRole('button', { name: /^start$/i }).click();

	await expect(page.getByText('MockFiveA')).toBeVisible();
	await page.getByRole('button', { name: /^reroll$/i }).click();
	await expect(page.getByText('MockFiveB')).toBeVisible();
});

test('going back re-offers the previous character', async ({ page }) => {
	await page.goto('/interactive');
	await setupMockApi(page);
	await page.getByRole('button', { name: /^start$/i }).click();

	await expect(page.getByText('MockFiveA')).toBeVisible();
	await page.getByRole('button', { name: /^accept$/i }).click();
	await expect(page.getByText('MockFiveB')).toBeVisible();
	await page.getByRole('button', { name: /^accept$/i }).click();
	await expect(page.getByText('MockFiveC')).toBeVisible();

	await page.getByRole('button', { name: /^go back/i }).click();
	await expect(page.getByText('MockFiveB')).toBeVisible();

	await page.getByRole('button', { name: /^accept$/i }).click();
	await page.getByRole('button', { name: /^accept$/i }).click();
	await page.getByRole('button', { name: /^accept$/i }).click();
	await expect(page.getByRole('heading', { name: /chosen characters/i })).toBeVisible();
});

test('accept as main is disabled on the final pick', async ({ page }) => {
	await page.goto('/interactive');
	await setupMockApi(page);
	await page.getByRole('button', { name: /^start$/i }).click();

	await page.getByRole('button', { name: /^accept$/i }).click();
	await page.getByRole('button', { name: /^accept$/i }).click();
	await page.getByRole('button', { name: /^accept$/i }).click();
	await expect(page.getByText('MockFiveD')).toBeVisible();
	await expect(page.getByRole('button', { name: /accept as main/i })).toBeDisabled();
});

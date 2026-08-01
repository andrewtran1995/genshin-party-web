import { test as base, expect, type Page } from '@playwright/test';

// Must match STORAGE_KEY in src/lib/player-presets.svelte.ts — duplicated here
// because that module pulls in Svelte runes and can't be imported outside Vite.
const PRESETS_STORAGE_KEY = 'genshin-party:presets:v1';

// A 4x4 solid-color PNG, served in place of real character art by `mockCharArt`.
const PLACEHOLDER_PNG = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEElEQVR4nGOY0pAARwzEcQBgEhdBC7oLoQAAAABJRU5ErkJggg==',
	'base64'
);

export interface FixturePreset {
	id: string;
	name: string;
	players: string[];
}

export interface PresetStoreOption {
	presets: FixturePreset[];
	defaultId: string | null;
}

/** Thin page object over `/interactive`, sharing the selectors every flow test needs. */
export class InteractivePage {
	constructor(private readonly page: Page) {}

	async goto() {
		await this.page.goto('/interactive');
		await expect(
			this.page.getByRole('heading', { name: /interactive party selection/i })
		).toBeVisible();
	}

	/** Fill 1..4 player name slots (clicking "Add player" between them) and start. */
	async start(names: string[] = []) {
		for (const [index, name] of names.entries()) {
			await this.page
				.getByRole('textbox', { name: new RegExp(`player ${index + 1}`, 'i') })
				.fill(name);
			if (index < names.length - 1) {
				await this.page.getByRole('button', { name: /^add player$/i }).click();
			}
		}
		await this.page.getByRole('button', { name: /^start$/i }).click();
	}

	get candidateHeading() {
		return this.page.getByRole('article').getByRole('heading', { level: 3 });
	}

	candidateRarityLabel(rarity: '4-star' | '5-star') {
		return this.page.getByRole('article').getByLabel(rarity);
	}

	async candidateName(): Promise<string | null> {
		return this.candidateHeading.textContent();
	}

	/** Accept the current candidate `times` times, waiting for each turn to render first. */
	async accept(times = 1) {
		for (let i = 0; i < times; i++) {
			await expect(this.page.getByText(/now choosing for/i)).toBeVisible();
			await this.page.getByRole('button', { name: /^accept$/i }).click();
		}
	}

	async acceptAsMain() {
		await this.page.getByRole('button', { name: /accept as main/i }).click();
	}

	async reroll() {
		await this.page.getByRole('button', { name: /^reroll$/i }).click();
	}

	async goBack() {
		await this.page.getByRole('button', { name: /^go back/i }).click();
	}

	get acceptAsMainButton() {
		return this.page.getByRole('button', { name: /accept as main/i });
	}

	get chosenCharactersHeading() {
		return this.page.getByRole('heading', { name: /chosen characters/i });
	}
}

interface Fixtures {
	/** localStorage-seeded preset store, applied before the page loads. Defaults to empty. */
	presets: PresetStoreOption;
	/** Page object for `/interactive`. */
	interactive: InteractivePage;
	/**
	 * Overrides `Math.random` with a fixed-seed PRNG in the browser context, so
	 * client-side rolls (char/boss/order pages, the interactive flow) are
	 * reproducible. Opt in via `test.extend<{}>({ ... })`-style fixture params,
	 * i.e. destructure `seededRandom` in a test to enable it. Does not affect
	 * server-side rolls (form-action submits with JS disabled).
	 */
	seededRandom: undefined;
	/**
	 * Serves a solid-color placeholder for character art instead of hitting the
	 * real CDNs (`char.portrait`/`char.icon` are absolute URLs to enka.network /
	 * mihoyo.com / the fandom wiki — unlike boss/element/weapon icons, they are
	 * never downloaded to `static/` at build time). Opt in for any test that
	 * needs the art `<img>` to actually finish loading (e.g. a screenshot),
	 * so it doesn't depend on those third parties being reachable.
	 */
	mockCharArt: undefined;
	/** Auto fixture: fails the test if the page logs a console or page error. */
	consoleErrors: undefined;
}

export const test = base.extend<Fixtures>({
	presets: [{ presets: [], defaultId: null }, { option: true }],

	page: async ({ page, presets }, use) => {
		if (presets.presets.length > 0 || presets.defaultId !== null) {
			await page.addInitScript(
				([key, value]) => {
					window.localStorage.setItem(key, value);
				},
				[PRESETS_STORAGE_KEY, JSON.stringify(presets)] as [string, string]
			);
		}
		await use(page);
	},

	seededRandom: async ({ page }, use) => {
		await page.addInitScript(() => {
			let seed = 42;
			Math.random = () => {
				seed = (seed * 1103515245 + 12345) & 0x7fffffff;
				return seed / 0x7fffffff;
			};
		});
		await use(undefined);
	},

	interactive: async ({ page }, use) => {
		await use(new InteractivePage(page));
	},

	mockCharArt: async ({ page }, use) => {
		// The app itself is always served from localhost; anything else is a
		// third-party asset (character art) safe to swap for a placeholder.
		await page.route(
			(url) => !/^(localhost|127\.0\.0\.1)$/.test(url.hostname),
			(route) =>
				route.request().resourceType() === 'image'
					? route.fulfill({ contentType: 'image/png', body: PLACEHOLDER_PNG })
					: route.continue()
		);
		await use(undefined);
	},

	// Fails any test that logs a page/console error, so hydration mismatches
	// and unhandled exceptions surface even when the DOM still looks correct.
	consoleErrors: [
		async ({ page }, use) => {
			const errors: string[] = [];
			page.on('pageerror', (err) => errors.push(String(err)));
			page.on('console', (msg) => {
				if (msg.type() === 'error') errors.push(msg.text());
			});
			await use(undefined);
			expect(errors, `Unexpected console/page errors:\n${errors.join('\n')}`).toEqual([]);
		},
		{ auto: true }
	]
});

export { expect };

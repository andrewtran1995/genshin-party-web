import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from './fixtures';

// Duplicated from `encodePathSegment` in `src/lib/genshin/path-segment.ts` and
// `readNames`/`dataDir` in `prerendered-routes.spec.ts` — see that file for why
// `src/lib/genshin` can't be imported directly here.
const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/lib/genshin/data');

const readNames = (file: string): string[] => {
	const entries = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8')) as {
		name: string;
	}[];
	return entries.map((entry) => entry.name);
};

const encodePathSegment = (value: string): string =>
	encodeURIComponent(value).replace(/%(2C|3B|3A|40|26|3D|2B|24)/gi, (_match, hex: string) =>
		String.fromCharCode(parseInt(hex, 16))
	);

// Regression coverage for the report-only policy in `svelte.config.js` (bounty-board
// issue #86): SvelteKit can only attach `Content-Security-Policy-Report-Only` as an
// HTTP header, and prerendered pages are served as static files with no header of
// their own — only the enforced `Content-Security-Policy` gets a <meta> fallback for
// those. So dynamic routes should carry the header and prerendered ones should not;
// both kinds must still render and hydrate without the policy interfering.

test('a dynamic route carries the report-only CSP header', async ({ request }) => {
	const response = await request.get('/char');
	const header = response.headers()['content-security-policy-report-only'];

	expect(header).toBeTruthy();
	expect(header).toContain('report-uri /csp-report');
	expect(header).toContain('https://enka.network');
	expect(header).toContain('https://upload-os-bbs.mihoyo.com');
});

test('a prerendered route has no report-only header', async ({ request }) => {
	const [name] = readNames('characters.json');

	const response = await request.get(`/char/${encodePathSegment(name)}`);

	expect(response.status()).toBe(200);
	expect(response.headers()['content-security-policy-report-only']).toBeUndefined();
});

test('the dynamic boss gauntlet route hydrates cleanly under the report-only policy', async ({
	page,
	mockCharArt
}) => {
	void mockCharArt;
	const [a, b, c] = readNames('bosses.json').slice(0, 3).map(encodePathSegment);

	const response = await page.goto(`/boss/${a}/${b}/${c}`);

	expect(response?.headers()['content-security-policy-report-only']).toBeTruthy();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Random boss gauntlet');
});

test('the prerendered char result route hydrates cleanly with no report-only header', async ({
	page,
	mockCharArt
}) => {
	void mockCharArt;
	const [name] = readNames('characters.json');

	const response = await page.goto(`/char/${encodePathSegment(name)}`);

	expect(response?.headers()['content-security-policy-report-only']).toBeUndefined();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Random character');
});

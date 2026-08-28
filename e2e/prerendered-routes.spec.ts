import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

// `src/lib/genshin` can't be imported here — it JSON-imports the generated
// dataset without an import attribute, which Vite handles but Playwright's
// plain-Node test runner doesn't (see fixtures.ts for the same constraint).
// Read the build-time-generated data files directly instead; `pnpm build`
// (this suite's `webServer` command) always regenerates them first.
const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/lib/genshin/data');

const readNames = (file: string): string[] => {
	const entries = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8')) as {
		name: string;
	}[];
	return entries.map((entry) => entry.name);
};

// Duplicated from `encodePathSegment` in `src/lib/genshin/rolls.ts` for the
// same import-boundary reason as the data above — keep in sync with it.
const encodePathSegment = (value: string): string =>
	encodeURIComponent(value).replace(/%(2C|3B|3A|40|26|3D|2B|24)/gi, (_match, hex: string) =>
		String.fromCharCode(parseInt(hex, 16))
	);

// Regression coverage for the prerendered-route/static-file-server mismatch:
// `rollBossUrl`/`rollCharUrl` build a path with `encodePathSegment`, but the
// prerenderer writes one static file per name via `entries()`. Every name in
// the dataset — not just the two known comma-bearing offenders — must
// resolve, since the static file server SvelteKit's `vite preview` uses
// (`decodeURI`, see rolls.ts) can't undo the percent-escapes a plain
// `encodeURIComponent` would have produced for other reserved characters.
test('every boss name resolves to a 200 at its rolled URL', async ({ request }) => {
	for (const name of readNames('bosses.json')) {
		const response = await request.get(`/boss/${encodePathSegment(name)}`);
		expect(response.status(), `boss "${name}"`).toBe(200);
	}
});

test('every character name resolves to a 200 at its rolled URL', async ({ request }) => {
	for (const name of readNames('characters.json')) {
		const response = await request.get(`/char/${encodePathSegment(name)}`);
		expect(response.status(), `char "${name}"`).toBe(200);
	}
});

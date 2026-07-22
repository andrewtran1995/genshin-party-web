/**
 * Build-time extraction of the Genshin dataset from `genshin-db`.
 *
 * `genshin-db` is a ~170 MB, Node-only, multi-language package — far too large
 * to ship into a Vercel function. It is a `devDependency` and is imported here
 * ONLY. This script trims it to the small, UI-shaped JSON that the runtime
 * reads (`src/lib/genshin/data/*`), which is a build artifact and not committed.
 *
 * Re-run with `pnpm gen:data` whenever the `genshin-db` version is bumped.
 * Use `pnpm gen:data -- --force` to re-download all icons.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import genshinDb from 'genshin-db';
import { map, values } from 'remeda';
import type { Char, Enemy } from '../src/lib/types.js';
import { downloadAll } from './lib/download.js';
import type { IconSource, PlannedIcon } from './lib/icon-plan.js';
import {
	planIconDownloads,
	plannedTasks,
	toBossIconSources,
	toIconSource
} from './lib/icon-plan.js';
import { filterBossEnemies, trimBoss, trimCharacters } from './lib/trim.js';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const dataDir = join(scriptDir, '../src/lib/genshin/data');
const staticBossIconsDir = join(scriptDir, '../static/icons/bosses');
const staticElementIconsDir = join(scriptDir, '../static/icons/elements');
const staticWeaponIconsDir = join(scriptDir, '../static/icons/weapons');

const FORCE = process.argv.includes('--force');

const queryOptions = { matchCategories: true, verboseCategories: true } as const;

const planIcons = <S extends IconSource>(
	sources: readonly S[],
	iconsDir: string,
	publicPath: string
): PlannedIcon<S>[] =>
	planIconDownloads(sources, {
		iconsDir,
		publicPath,
		isIconDownloaded: (filename) => existsSync(join(iconsDir, filename)),
		force: FORCE
	});

const characters: Char[] = trimCharacters(genshinDb.characters('names', queryOptions));

const rawEnemies = genshinDb.enemies('names', queryOptions);
const bossEnemies = filterBossEnemies(rawEnemies);

interface YattaMonster {
	id: number;
	name: string;
	icon: string;
}

async function fetchYattaMonsterIcons(): Promise<Map<number, string>> {
	const response = await fetch('https://gi.yatta.moe/api/v2/en/monster');
	if (!response.ok) throw new Error(`Yatta API failed: ${response.status}`);
	const json = (await response.json()) as {
		response: number;
		data: { items: Record<string, YattaMonster> };
	};
	return new Map(map(values(json.data.items), (item): [number, string] => [item.id, item.icon]));
}

const needsYattaFetch =
	!FORCE &&
	bossEnemies.some(
		(enemy) =>
			!enemy.images?.filename_icon ||
			!existsSync(join(staticBossIconsDir, `${enemy.images.filename_icon}.png`))
	);

let yattaIconById = new Map<number, string>();
if (needsYattaFetch) {
	try {
		yattaIconById = await fetchYattaMonsterIcons();
	} catch (err) {
		console.warn('Yatta API unavailable; falling back to genshin-db icon filenames:', err);
	}
}

const bossPlan = planIcons(
	toBossIconSources(bossEnemies, yattaIconById),
	staticBossIconsDir,
	'/icons/bosses'
);

const downloadDeps = {
	fetch,
	mkdirSync: (dir: string) => mkdirSync(dir, { recursive: true }),
	writeFileSync
};

await downloadAll(plannedTasks(bossPlan), downloadDeps);

const bosses: Enemy[] = bossPlan.map(({ source, publicPath }) => trimBoss(source.boss, publicPath));

mkdirSync(dataDir, { recursive: true });
writeFileSync(join(dataDir, 'characters.json'), `${JSON.stringify(characters, undefined, '\t')}\n`);
writeFileSync(join(dataDir, 'bosses.json'), `${JSON.stringify(bosses, undefined, '\t')}\n`);

const elementIcons = genshinDb.elements('names', queryOptions) as {
	name: string;
	images: { wikia?: string };
}[];

const elementIconPlan = planIcons(
	elementIcons.map((el) => toIconSource(el.name.toLowerCase(), el.images.wikia)),
	staticElementIconsDir,
	'/icons/elements'
);
await downloadAll(plannedTasks(elementIconPlan), downloadDeps);

const weaponIconUrls: Record<string, string> = {
	sword: 'https://static.wikia.nocookie.net/gensin-impact/images/8/81/Icon_Sword.png',
	claymore: 'https://static.wikia.nocookie.net/gensin-impact/images/6/66/Icon_Claymore.png',
	bow: 'https://static.wikia.nocookie.net/gensin-impact/images/8/81/Icon_Bow.png',
	polearm: 'https://static.wikia.nocookie.net/gensin-impact/images/6/6a/Icon_Polearm.png',
	catalyst: 'https://static.wikia.nocookie.net/gensin-impact/images/2/27/Icon_Catalyst.png'
};

const weaponIconPlan = planIcons(
	Object.entries(weaponIconUrls).map(([key, url]) => toIconSource(key, url)),
	staticWeaponIconsDir,
	'/icons/weapons'
);
await downloadAll(plannedTasks(weaponIconPlan), downloadDeps);

console.log(`Wrote ${characters.length} characters and ${bosses.length} bosses to ${dataDir}`);

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
import type { Char, Enemy } from '../src/lib/types.js';
import { downloadAll } from './lib/download.js';
import { planBossIconDownloads, planIconDownloads } from './lib/icon-plan.js';
import { filterBossEnemies, trimBoss, trimCharacters } from './lib/trim.js';

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '../src/lib/genshin/data');
const staticBossIconsDir = join(dirname(fileURLToPath(import.meta.url)), '../static/icons/bosses');
const staticElementIconsDir = join(
	dirname(fileURLToPath(import.meta.url)),
	'../static/icons/elements'
);
const staticWeaponIconsDir = join(
	dirname(fileURLToPath(import.meta.url)),
	'../static/icons/weapons'
);

const FORCE = process.argv.includes('--force');

const queryOptions = { matchCategories: true, verboseCategories: true } as const;

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
	const icons = new Map<number, string>();
	for (const item of Object.values(json.data.items)) {
		icons.set(item.id, item.icon);
	}
	return icons;
}

const isBossIconDownloaded = (filename: string) => existsSync(join(staticBossIconsDir, filename));

const needsYattaFetch =
	!FORCE &&
	bossEnemies.some(
		(enemy) =>
			!enemy.images?.filename_icon || !isBossIconDownloaded(`${enemy.images.filename_icon}.png`)
	);

let yattaIconById: Map<number, string> | undefined;
if (needsYattaFetch) {
	try {
		yattaIconById = await fetchYattaMonsterIcons();
	} catch (err) {
		console.warn('Yatta API unavailable; falling back to genshin-db icon filenames:', err);
	}
}

const bossPlan = planBossIconDownloads(bossEnemies, {
	iconsDir: staticBossIconsDir,
	publicPath: '/icons/bosses',
	yattaIconById,
	isIconDownloaded: isBossIconDownloaded,
	force: FORCE
});

const downloadDeps = {
	fetch,
	existsSync,
	mkdirSync: (dir: string) => mkdirSync(dir, { recursive: true }),
	writeFileSync
};

await downloadAll(bossPlan.tasks, downloadDeps, FORCE);

const bosses: Enemy[] = bossEnemies.map((enemy) =>
	trimBoss(enemy, bossPlan.iconByName.get(enemy.name))
);

mkdirSync(dataDir, { recursive: true });
writeFileSync(join(dataDir, 'characters.json'), `${JSON.stringify(characters, undefined, '\t')}\n`);
writeFileSync(join(dataDir, 'bosses.json'), `${JSON.stringify(bosses, undefined, '\t')}\n`);

const elementIcons = genshinDb.elements('names', queryOptions) as {
	name: string;
	images: { wikia?: string };
}[];

const elementIconSources = elementIcons.map((el) => ({
	key: el.name.toLowerCase(),
	remoteUrl: el.images.wikia
}));

const elementIconPlan = planIconDownloads(elementIconSources, {
	iconsDir: staticElementIconsDir,
	publicPath: '/icons/elements',
	isIconDownloaded: (filename) => existsSync(join(staticElementIconsDir, filename)),
	force: FORCE
});
await downloadAll(elementIconPlan.tasks, downloadDeps, FORCE);

const weaponIconUrls: Record<string, string> = {
	sword: 'https://static.wikia.nocookie.net/gensin-impact/images/8/81/Icon_Sword.png',
	claymore: 'https://static.wikia.nocookie.net/gensin-impact/images/6/66/Icon_Claymore.png',
	bow: 'https://static.wikia.nocookie.net/gensin-impact/images/8/81/Icon_Bow.png',
	polearm: 'https://static.wikia.nocookie.net/gensin-impact/images/6/6a/Icon_Polearm.png',
	catalyst: 'https://static.wikia.nocookie.net/gensin-impact/images/2/27/Icon_Catalyst.png'
};

const weaponIconSources = Object.entries(weaponIconUrls).map(([key, remoteUrl]) => ({
	key,
	remoteUrl
}));

const weaponIconPlan = planIconDownloads(weaponIconSources, {
	iconsDir: staticWeaponIconsDir,
	publicPath: '/icons/weapons',
	isIconDownloaded: (filename) => existsSync(join(staticWeaponIconsDir, filename)),
	force: FORCE
});
await downloadAll(weaponIconPlan.tasks, downloadDeps, FORCE);

console.log(`Wrote ${characters.length} characters and ${bosses.length} bosses to ${dataDir}`);

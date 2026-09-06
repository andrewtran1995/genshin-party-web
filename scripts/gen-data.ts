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
import { Effect } from 'effect';
import genshinDb from 'genshin-db';
import type { Char, Enemy } from '../src/lib/types.js';
import { downloadAll, type DownloadPorts } from './lib/download.js';
import {
	planIconDownloads,
	plannedTasks,
	toBossIconSources,
	toIconSource,
	type DownloadTask,
	type IconSource,
	type PlannedIcon
} from './lib/icon-plan.js';
import { buildSizeReport, measureDataFile } from './lib/size-report.js';
import { filterBossEnemies, trimBoss, trimCharacters } from './lib/trim.js';
import { fetchMonsterIcons } from './lib/yatta.js';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const dataDir = join(scriptDir, '../src/lib/genshin/data');
const sizeReportPath = join(scriptDir, '../src/lib/genshin/data-size.json');
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

const ports: DownloadPorts = {
	get: (url, signal) => fetch(url, { signal }),
	write: (path, bytes) => {
		mkdirSync(dirname(path), { recursive: true });
		writeFileSync(path, bytes);
	}
};

const downloadOrExit = (tasks: readonly DownloadTask[]): Promise<void> =>
	Effect.runPromise(
		downloadAll(tasks, ports).pipe(
			Effect.catchTag('DownloadFailures', (failure) =>
				Effect.sync(() => {
					console.error(failure.message);
					process.exit(1);
				})
			)
		)
	);

const needsYattaFetch =
	!FORCE &&
	bossEnemies.some(
		(enemy) =>
			!enemy.images?.filename_icon ||
			!existsSync(join(staticBossIconsDir, `${enemy.images.filename_icon}.png`))
	);

let yattaIconById: ReadonlyMap<number, string> = new Map();
if (needsYattaFetch) {
	yattaIconById = await Effect.runPromise(
		fetchMonsterIcons(ports).pipe(
			Effect.catchTag('YattaUnavailable', (failure) =>
				Effect.sync(() => {
					console.warn(
						`Yatta API unusable, falling back to genshin-db icon filenames — ${failure.message}`
					);
					return new Map<number, string>();
				})
			)
		)
	);
}

const bossPlan = planIcons(
	toBossIconSources(bossEnemies, yattaIconById),
	staticBossIconsDir,
	'/icons/bosses'
);

await downloadOrExit(plannedTasks(bossPlan));

const bosses: Enemy[] = bossPlan.map(({ source, publicPath }) => trimBoss(source.boss, publicPath));

mkdirSync(dataDir, { recursive: true });
const charactersJson = `${JSON.stringify(characters, undefined, '\t')}\n`;
const bossesJson = `${JSON.stringify(bosses, undefined, '\t')}\n`;
writeFileSync(join(dataDir, 'characters.json'), charactersJson);
writeFileSync(join(dataDir, 'bosses.json'), bossesJson);

// Tracked in git (unlike the data files above) so a PR that changes the shipped
// dataset shows the size delta in its diff instead of it moving silently.
writeFileSync(
	sizeReportPath,
	buildSizeReport([
		measureDataFile('characters.json', charactersJson),
		measureDataFile('bosses.json', bossesJson)
	])
);

const elementIcons = genshinDb.elements('names', queryOptions) as {
	name: string;
	images: { wikia?: string };
}[];

const elementIconPlan = planIcons(
	elementIcons.map((el) => toIconSource(el.name.toLowerCase(), el.images.wikia)),
	staticElementIconsDir,
	'/icons/elements'
);
await downloadOrExit(plannedTasks(elementIconPlan));

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
await downloadOrExit(plannedTasks(weaponIconPlan));

console.log(`Wrote ${characters.length} characters and ${bosses.length} bosses to ${dataDir}`);

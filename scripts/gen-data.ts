/**
 * Build-time extraction of the Genshin dataset from `genshin-db`.
 *
 * `genshin-db` is a ~170 MB, Node-only, multi-language package — far too large
 * to ship into a Vercel function. It is a `devDependency` and is imported here
 * ONLY. This script trims it to the small, UI-shaped JSON that the runtime
 * reads (`src/lib/server/genshin/data/*`), which is committed to the repo.
 *
 * Re-run with `pnpm gen:data` whenever the `genshin-db` version is bumped.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { filter, map, pipe } from 'remeda';
import genshinDb from 'genshin-db';
import type { Char, Element, Enemy } from '../src/lib/types.ts';

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '../src/lib/server/genshin/data');

const queryOptions = { matchCategories: true, verboseCategories: true } as const;

/** `ELEMENT_PYRO` → `pyro`, matching the `elements` form values. */
const toElement = (elementType: string): Element =>
	elementType.replace(/^ELEMENT_/, '').toLowerCase() as Element;

const characters: Char[] = pipe(
	genshinDb.characters('names', queryOptions),
	// Exclude Aether so the Traveler isn't returned twice (Aether + Lumine).
	filter((char) => char.name !== 'Aether'),
	map((char) => ({
		id: char.id,
		name: char.name,
		title: char.title,
		rarity: char.rarity,
		element: toElement(char.elementType),
		elementText: char.elementText,
		weaponText: char.weaponText,
		region: char.region,
		// Fandom/Wikia portrait URLs (char.images.portrait) are broken as of mid-2026.
		// Use enka.network which mirrors HoYoverse game assets reliably.
		// filename_gachaSplash is undefined for Lumine (Traveler), so derive it
		// from filename_icon as a fallback (UI_AvatarIcon_X → UI_Gacha_AvatarImg_X).
		portrait: (() => {
			const splash =
				char.images.filename_gachaSplash ??
				char.images.filename_icon?.replace('UI_AvatarIcon_', 'UI_Gacha_AvatarImg_');
			return splash ? `https://enka.network/ui/${splash}.png` : undefined;
		})(),
		icon: char.images.mihoyo_icon ?? undefined,
		fandomUrl: char.url?.fandom ?? undefined
	}))
);

const bosses: Enemy[] = pipe(
	genshinDb.enemies('names', queryOptions),
	// Keep only enemies reachable by either boss filter; drop the rest of the
	// bestiary so the shipped JSON stays small. Exclude Stormterror (the CLI
	// does too — it has no weekly-boss arena).
	filter(
		(enemy) =>
			enemy.name !== 'Stormterror' &&
			(enemy.enemyType === 'BOSS' || enemy.categoryType === 'CODEX_SUBTYPE_BOSS')
	),
	map((enemy) => ({
		name: enemy.name,
		description: enemy.description,
		categoryType: enemy.categoryType,
		enemyType: enemy.enemyType
	}))
);

mkdirSync(dataDir, { recursive: true });
writeFileSync(join(dataDir, 'characters.json'), `${JSON.stringify(characters, undefined, '\t')}\n`);
writeFileSync(join(dataDir, 'bosses.json'), `${JSON.stringify(bosses, undefined, '\t')}\n`);

console.log(`Wrote ${characters.length} characters and ${bosses.length} bosses to ${dataDir}`);

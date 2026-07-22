import { filter, isDefined, isNonNullish, map, pipe, unique } from 'remeda';
import type { RawEnemy } from './trim.js';

export interface IconTarget {
	url: string;
	filename: string;
}

export interface IconSource {
	key: string;
	/** Candidate downloads in preference order; the first cached one wins. */
	targets: readonly IconTarget[];
}

export interface DownloadTask {
	url: string;
	dir: string;
	filename: string;
}

export interface PlannedIcon<S extends IconSource> {
	source: S;
	publicPath: string;
	task?: DownloadTask;
}

export interface IconPlanOptions {
	iconsDir: string;
	publicPath: string;
	isIconDownloaded: (filename: string) => boolean;
	force?: boolean;
}

const remoteMonsterIconUrl = (filename: string): string =>
	`https://gi.yatta.moe/assets/UI/monster/${filename}.png`;

export interface BossIconSource extends IconSource {
	boss: RawEnemy;
}

export const toBossIconSources = (
	bosses: readonly RawEnemy[],
	yattaIconById: ReadonlyMap<number, string>
): BossIconSource[] =>
	bosses.map((boss) => ({
		boss,
		key: boss.name,
		targets: pipe(
			[yattaIconById.get(boss.id), boss.images?.filename_icon],
			filter(isNonNullish),
			unique(),
			map((filename) => ({ url: remoteMonsterIconUrl(filename), filename: `${filename}.png` }))
		)
	}));

export const toIconSource = (key: string, remoteUrl: string | undefined): IconSource => ({
	key,
	targets: remoteUrl ? [{ url: remoteUrl, filename: `${key}.png` }] : []
});

export const planIconDownloads = <S extends IconSource>(
	sources: readonly S[],
	options: IconPlanOptions
): PlannedIcon<S>[] =>
	sources.map((source) => {
		const cached = options.force
			? undefined
			: source.targets.find((target) => options.isIconDownloaded(target.filename));
		if (cached) {
			return { source, publicPath: `${options.publicPath}/${cached.filename}` };
		}
		const target = source.targets[0];
		if (!target) {
			throw new Error(`Unable to resolve icon for ${source.key}`);
		}
		return {
			source,
			publicPath: `${options.publicPath}/${target.filename}`,
			task: { url: target.url, dir: options.iconsDir, filename: target.filename }
		};
	});

export const plannedTasks = <S extends IconSource>(
	plan: readonly PlannedIcon<S>[]
): DownloadTask[] =>
	filter(
		map(plan, (planned) => planned.task),
		isDefined
	);

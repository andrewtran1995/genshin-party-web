import type { RawEnemy } from './trim.js';

export interface DownloadTask {
	type: 'image';
	url: string;
	dir: string;
	filename: string;
}

export interface IconPlanOptions {
	iconsDir: string;
	publicPath: string;
	yattaIconById: ReadonlyMap<number, string> | undefined;
	isIconDownloaded: (filename: string) => boolean;
	force?: boolean;
}

export interface BossIconPlan {
	tasks: DownloadTask[];
	iconByName: Map<string, string>;
}

export interface IconSource {
	key: string;
	remoteUrl: string | undefined;
}

export interface IconPlan {
	tasks: DownloadTask[];
	publicPathByKey: Map<string, string>;
}

const remoteMonsterIconUrl = (filename: string): string =>
	`https://gi.yatta.moe/assets/UI/monster/${filename}.png`;

export const planBossIconDownloads = (
	bosses: readonly RawEnemy[],
	options: IconPlanOptions
): BossIconPlan => {
	const tasks: DownloadTask[] = [];
	const iconByName = new Map<string, string>();

	for (const boss of bosses) {
		const candidates = [options.yattaIconById?.get(boss.id), boss.images?.filename_icon].filter(
			(candidate): candidate is string => Boolean(candidate)
		);

		const uniqueCandidates = [...new Set(candidates)];
		const existingFilename = options.force
			? undefined
			: uniqueCandidates.find((candidate) => options.isIconDownloaded(`${candidate}.png`));

		if (existingFilename) {
			iconByName.set(boss.name, `${options.publicPath}/${existingFilename}.png`);
			continue;
		}

		const chosen = uniqueCandidates[0];
		if (!chosen) {
			throw new Error(`Unable to resolve icon for ${boss.name}`);
		}

		tasks.push({
			type: 'image',
			url: remoteMonsterIconUrl(chosen),
			dir: options.iconsDir,
			filename: `${chosen}.png`
		});
		iconByName.set(boss.name, `${options.publicPath}/${chosen}.png`);
	}

	return { tasks, iconByName };
};

export const planIconDownloads = (
	sources: readonly IconSource[],
	options: Pick<IconPlanOptions, 'iconsDir' | 'publicPath' | 'isIconDownloaded' | 'force'>
): IconPlan => {
	const tasks: DownloadTask[] = [];
	const publicPathByKey = new Map<string, string>();

	for (const source of sources) {
		const filename = `${source.key}.png`;
		if (!options.force && options.isIconDownloaded(filename)) {
			publicPathByKey.set(source.key, `${options.publicPath}/${filename}`);
			continue;
		}
		if (!source.remoteUrl) {
			throw new Error(`No remote URL for icon: ${source.key}`);
		}
		tasks.push({
			type: 'image',
			url: source.remoteUrl,
			dir: options.iconsDir,
			filename
		});
		publicPathByKey.set(source.key, `${options.publicPath}/${filename}`);
	}

	return { tasks, publicPathByKey };
};

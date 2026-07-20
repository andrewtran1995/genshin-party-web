import { join } from 'node:path';
import type { DownloadTask } from './icon-plan.ts';

export interface DownloadDeps {
	fetch: (url: string) => Promise<Response>;
	existsSync: (path: string) => boolean;
	mkdirSync: (path: string) => void;
	writeFileSync: (path: string, data: Uint8Array) => void;
}

export const downloadIcon = async (
	task: DownloadTask,
	deps: DownloadDeps,
	force = false
): Promise<void> => {
	const path = join(task.dir, task.filename);
	if (!force && deps.existsSync(path)) return;

	const response = await deps.fetch(task.url);
	if (!response.ok) {
		throw new Error(`Failed to fetch ${task.url}: ${response.status}`);
	}

	const buffer = new Uint8Array(await response.arrayBuffer());
	deps.mkdirSync(task.dir);
	deps.writeFileSync(path, buffer);
};

const downloadWithRetry = async (
	task: DownloadTask,
	deps: DownloadDeps,
	force = false
): Promise<void> => {
	try {
		await downloadIcon(task, deps, force);
	} catch {
		await downloadIcon(task, deps, force);
	}
};

export const downloadAll = (
	tasks: readonly DownloadTask[],
	deps: DownloadDeps,
	force = false
): Promise<void> =>
	Promise.all(tasks.map((task) => downloadWithRetry(task, deps, force))).then(() => undefined);

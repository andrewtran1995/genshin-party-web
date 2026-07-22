import { join } from 'node:path';
import { constant } from 'remeda';
import type { DownloadTask } from './icon-plan.ts';

export interface DownloadDeps {
	fetch: (url: string) => Promise<Response>;
	mkdirSync: (path: string) => void;
	writeFileSync: (path: string, data: Uint8Array) => void;
}

export const downloadIcon = async (task: DownloadTask, deps: DownloadDeps): Promise<void> => {
	const response = await deps.fetch(task.url);
	if (!response.ok) {
		throw new Error(`Failed to fetch ${task.url}: ${response.status}`);
	}

	const buffer = new Uint8Array(await response.arrayBuffer());
	deps.mkdirSync(task.dir);
	deps.writeFileSync(join(task.dir, task.filename), buffer);
};

export const downloadAll = (tasks: readonly DownloadTask[], deps: DownloadDeps): Promise<void> =>
	Promise.all(tasks.map((task) => downloadIcon(task, deps))).then(constant(undefined));

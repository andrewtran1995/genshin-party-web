import { join } from 'node:path';
import { Data, Effect } from 'effect';
import {
	defaultRequestOptions,
	describeCause,
	fetchAndRead,
	type HttpPorts,
	type RequestFailure,
	type RequestOptions
} from './http.js';
import type { DownloadTask } from './icon-plan.js';

export const DEFAULT_CONCURRENCY = 8;

export interface DownloadPorts extends HttpPorts {
	/** Writes `bytes` to `path`, creating parent directories as needed. */
	readonly write: (path: string, bytes: Uint8Array) => void;
}

export interface DownloadOptions extends RequestOptions {
	readonly concurrency: number;
}

export const defaultDownloadOptions: DownloadOptions = {
	...defaultRequestOptions,
	concurrency: DEFAULT_CONCURRENCY
};

export class WriteFailure extends Data.TaggedError('WriteFailure')<{
	readonly path: string;
	readonly message: string;
}> {}

export type DownloadFailure = RequestFailure | WriteFailure;

export class DownloadFailures extends Data.TaggedError('DownloadFailures')<{
	readonly failures: readonly DownloadFailure[];
	readonly message: string;
}> {}

export const formatFailures = (failures: readonly DownloadFailure[]): string =>
	[
		`${failures.length} icon download${failures.length === 1 ? '' : 's'} failed:`,
		...failures.map((failure) => `  - ${failure.message}`)
	].join('\n');

export const downloadIcon = (
	task: DownloadTask,
	ports: DownloadPorts,
	options: DownloadOptions = defaultDownloadOptions
): Effect.Effect<void, DownloadFailure> =>
	fetchAndRead(task.url, (response) => response.arrayBuffer(), ports, options).pipe(
		Effect.flatMap((buffer) => {
			const path = join(task.dir, task.filename);
			return Effect.try({
				try: () => {
					ports.write(path, new Uint8Array(buffer));
				},
				catch: (cause) => new WriteFailure({ path, message: `${path}: ${describeCause(cause)}` })
			});
		})
	);

export const downloadAll = (
	tasks: readonly DownloadTask[],
	ports: DownloadPorts,
	options: DownloadOptions = defaultDownloadOptions
): Effect.Effect<void, DownloadFailures> =>
	Effect.partition(tasks, (task) => downloadIcon(task, ports, options), {
		concurrency: options.concurrency
	}).pipe(
		Effect.flatMap(([failures]) =>
			failures.length === 0
				? Effect.void
				: Effect.fail(new DownloadFailures({ failures, message: formatFailures(failures) }))
		)
	);

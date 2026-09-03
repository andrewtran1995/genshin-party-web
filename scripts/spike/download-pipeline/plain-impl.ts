/**
 * SPIKE — the plain-TypeScript implementation of ./contract.ts, written to the
 * same guarantees and held to the same test suite. See ./README.md.
 *
 * No dependency beyond what the repo already has.
 */
import { join } from 'node:path';
import {
	httpFailure,
	networkFailure,
	writeFailure,
	type DownloadFailure,
	type DownloadPorts,
	type DownloadOptions,
	type MakeDownloadAll
} from './contract.js';
import type { DownloadTask } from '../../lib/icon-plan.js';

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const attempt = async (
	task: DownloadTask,
	ports: DownloadPorts,
	timeoutMs: number
): Promise<DownloadFailure | undefined> => {
	const controller = new AbortController();
	const timer = setTimeout(() => {
		controller.abort(new Error(`no response in ${timeoutMs}ms`));
	}, timeoutMs);
	try {
		const response = await ports.get(task.url, controller.signal);
		if (!response.ok) return httpFailure(task.url, response.status);
		const bytes = new Uint8Array(await response.arrayBuffer());
		try {
			ports.write(join(task.dir, task.filename), bytes);
		} catch (cause) {
			return writeFailure(task.url, cause);
		}
		return undefined;
	} catch (cause) {
		return networkFailure(task.url, cause);
	} finally {
		clearTimeout(timer);
	}
};

const downloadOne = async (
	task: DownloadTask,
	ports: DownloadPorts,
	options: DownloadOptions
): Promise<DownloadFailure | undefined> => {
	let backoff = options.backoffBaseMs;
	for (let remaining = options.retries; ; remaining -= 1) {
		const failure = await attempt(task, ports, options.attemptTimeoutMs);
		if (!failure) return undefined;
		if (!failure.retryable || remaining === 0) return failure;
		await sleep(Math.random() * backoff);
		backoff *= 2;
	}
};

export const makeDownloadAll: MakeDownloadAll = (ports, options) => async (tasks) => {
	const failures: DownloadFailure[] = [];
	let cursor = 0;
	const worker = async (): Promise<void> => {
		for (let index = cursor++; index < tasks.length; index = cursor++) {
			const task = tasks[index];
			if (task === undefined) continue;
			const failure = await downloadOne(task, ports, options);
			if (failure) failures.push(failure);
		}
	};
	await Promise.all(
		Array.from({ length: Math.min(options.concurrency, tasks.length) }, () => worker())
	);
	return failures;
};

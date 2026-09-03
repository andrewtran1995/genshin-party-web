/** SPIKE — the Effect implementation of ./contract.ts. See ./README.md. */
import { join } from 'node:path';
import { Duration, Effect, Schedule } from 'effect';
import type { DownloadTask } from '../../lib/icon-plan.js';
import {
	httpFailure,
	networkFailure,
	writeFailure,
	type DownloadFailure,
	type MakeDownloadAll
} from './contract.js';

export const makeDownloadAll: MakeDownloadAll = (ports, options) => {
	const retryPolicy = Schedule.exponential(Duration.millis(options.backoffBaseMs), 2).pipe(
		Schedule.jittered,
		Schedule.intersect(Schedule.recurs(options.retries))
	);

	const downloadOne = (task: DownloadTask): Effect.Effect<void, DownloadFailure> =>
		Effect.gen(function* () {
			// `signal` is aborted when the fiber is interrupted, so the timeout
			// below cancels the in-flight request rather than just walking away.
			const response = yield* Effect.tryPromise({
				try: (signal) => ports.get(task.url, signal),
				catch: (cause) => networkFailure(task.url, cause)
			});
			if (!response.ok) {
				return yield* Effect.fail(httpFailure(task.url, response.status));
			}
			const bytes = yield* Effect.tryPromise({
				try: () => response.arrayBuffer(),
				catch: (cause) => networkFailure(task.url, cause)
			});
			yield* Effect.try({
				try: () => ports.write(join(task.dir, task.filename), new Uint8Array(bytes)),
				catch: (cause) => writeFailure(task.url, cause)
			});
		}).pipe(
			Effect.timeout(Duration.millis(options.attemptTimeoutMs)),
			Effect.catchTag('TimeoutException', () =>
				Effect.fail(networkFailure(task.url, `no response in ${options.attemptTimeoutMs}ms`))
			),
			Effect.retry({ schedule: retryPolicy, while: (failure) => failure.retryable })
		);

	return (tasks) =>
		Effect.runPromise(
			Effect.partition(tasks, downloadOne, { concurrency: options.concurrency }).pipe(
				Effect.map(([failures]) => failures)
			)
		);
};

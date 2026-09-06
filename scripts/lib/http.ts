/**
 * Shared HTTP concerns for the build-time scripts.
 *
 * `gen-data.ts` reaches the network twice — the Yatta monster index and ~60
 * icon downloads — and both want the same three things a bare `fetch` does not
 * give them: a bound on how long one attempt may hang, a retry for failures
 * that are worth retrying, and errors a caller can tell apart. `fetchAndRead`
 * is that one primitive; `download.ts` and `yatta.ts` differ only in how they
 * read the body.
 *
 * See `docs/adr/0002-effect-ts-for-backend-code.md` for why this is Effect and
 * why nothing under `src/` is.
 */
import { Data, Duration, Effect, Schedule } from 'effect';

export interface HttpPorts {
	/**
	 * Receives an `AbortSignal` that is aborted when the attempt is abandoned,
	 * so a timed-out request is cancelled rather than left in flight.
	 */
	readonly get: (url: string, signal: AbortSignal) => Promise<Response>;
}

export interface RequestOptions {
	/** Extra attempts after the first, for transient failures only. */
	readonly retries: number;
	readonly attemptTimeoutMs: number;
	readonly backoffBaseMs: number;
}

export const defaultRequestOptions: RequestOptions = {
	retries: 3,
	attemptTimeoutMs: 15_000,
	backoffBaseMs: 250
};

export class HttpFailure extends Data.TaggedError('HttpFailure')<{
	readonly url: string;
	readonly status: number;
	readonly message: string;
}> {}

export class NetworkFailure extends Data.TaggedError('NetworkFailure')<{
	readonly url: string;
	readonly message: string;
}> {}

export type RequestFailure = HttpFailure | NetworkFailure;

export const describeCause = (cause: unknown): string =>
	cause instanceof Error ? cause.message : String(cause);

export const httpFailure = (url: string, status: number): HttpFailure =>
	new HttpFailure({ url, status, message: `${url} returned ${status}` });

export const networkFailure = (url: string, cause: unknown): NetworkFailure =>
	new NetworkFailure({ url, message: `${url}: ${describeCause(cause)}` });

/**
 * A 5xx or a transport error is worth another go. A 4xx is not: it means we
 * asked for something that is not there, and retrying only makes the build
 * slower before it fails anyway.
 */
const isTransient = (failure: RequestFailure): boolean =>
	failure._tag === 'NetworkFailure' || failure.status >= 500;

const retryPolicy = (options: RequestOptions) =>
	Schedule.exponential(Duration.millis(options.backoffBaseMs), 2).pipe(
		Schedule.jittered,
		Schedule.intersect(Schedule.recurs(options.retries))
	);

/**
 * GETs `url` and reads the body with `read`, bounded per attempt and retried on
 * transient failures. The body read is inside the retry, so a connection that
 * drops mid-download is retried rather than reported as a hard failure.
 */
export const fetchAndRead = <T>(
	url: string,
	read: (response: Response) => Promise<T>,
	ports: HttpPorts,
	options: RequestOptions = defaultRequestOptions
): Effect.Effect<T, RequestFailure> =>
	Effect.gen(function* () {
		const response = yield* Effect.tryPromise({
			try: (signal) => ports.get(url, signal),
			catch: (cause) => networkFailure(url, cause)
		});
		if (!response.ok) {
			return yield* Effect.fail(httpFailure(url, response.status));
		}
		return yield* Effect.tryPromise({
			try: () => read(response),
			catch: (cause) => networkFailure(url, cause)
		});
	}).pipe(
		// Enforced by interrupting the fiber, so it holds even if a transport
		// ignores the abort signal it was handed.
		Effect.timeout(Duration.millis(options.attemptTimeoutMs)),
		Effect.catchTag('TimeoutException', () =>
			Effect.fail(networkFailure(url, `no response in ${options.attemptTimeoutMs}ms`))
		),
		Effect.retry({ schedule: retryPolicy(options), while: isTransient })
	);

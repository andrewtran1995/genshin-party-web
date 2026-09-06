import { Data, Duration, Effect, Schedule } from 'effect';

export interface HttpPorts {
	readonly get: (url: string, signal: AbortSignal) => Promise<Response>;
}

export interface RequestOptions {
	/** Extra attempts after the first. */
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

const isTransient = (failure: RequestFailure): boolean =>
	failure._tag === 'NetworkFailure' || failure.status >= 500;

const retryPolicy = (options: RequestOptions) =>
	Schedule.exponential(Duration.millis(options.backoffBaseMs), 2).pipe(
		Schedule.jittered,
		Schedule.intersect(Schedule.recurs(options.retries))
	);

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
		Effect.timeout(Duration.millis(options.attemptTimeoutMs)),
		Effect.catchTag('TimeoutException', () =>
			Effect.fail(networkFailure(url, `no response in ${options.attemptTimeoutMs}ms`))
		),
		Effect.retry({ schedule: retryPolicy(options), while: isTransient })
	);

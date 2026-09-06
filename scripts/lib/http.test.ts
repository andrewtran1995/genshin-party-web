import { describe, expect, it, vi } from 'vitest';
import { Effect } from 'effect';
import { fetchAndRead, type HttpPorts, type RequestOptions } from './http.js';

const url = 'https://example.com/thing.png';

const options: RequestOptions = { retries: 3, attemptTimeoutMs: 200, backoffBaseMs: 1 };

const ok = (body = 'hi') => new Response(body, { status: 200 });
const status = (code: number) => new Response(null, { status: code });

const readText = (response: Response) => response.text();

const ports = (get: HttpPorts['get']): HttpPorts => ({ get });

describe('fetchAndRead', () => {
	it('returns the read body', async () => {
		const body = await Effect.runPromise(
			fetchAndRead(
				url,
				readText,
				ports(() => Promise.resolve(ok('bytes'))),
				options
			)
		);
		expect(body).toBe('bytes');
	});

	it('fails with a typed HttpFailure naming the url and status', async () => {
		const failure = await Effect.runPromise(
			Effect.flip(
				fetchAndRead(
					url,
					readText,
					ports(() => Promise.resolve(status(404))),
					options
				)
			)
		);
		expect(failure).toMatchObject({ _tag: 'HttpFailure', url, status: 404 });
		expect(failure.message).toContain('404');
	});

	it('does not retry a 404 — the url is wrong, not the network', async () => {
		const get = vi.fn(() => Promise.resolve(status(404)));
		await Effect.runPromise(Effect.ignore(fetchAndRead(url, readText, ports(get), options)));
		expect(get).toHaveBeenCalledTimes(1);
	});

	it('retries a 503 and succeeds once the host recovers', async () => {
		let calls = 0;
		const body = await Effect.runPromise(
			fetchAndRead(
				url,
				readText,
				ports(() => {
					calls += 1;
					return Promise.resolve(calls < 3 ? status(503) : ok('recovered'));
				}),
				options
			)
		);
		expect(body).toBe('recovered');
		expect(calls).toBe(3);
	});

	it('gives up once the retry budget is exhausted', async () => {
		const get = vi.fn(() => Promise.resolve(status(503)));
		await Effect.runPromise(Effect.ignore(fetchAndRead(url, readText, ports(get), options)));
		// Four attempts: the first, plus the three `retries` allows.
		expect(get).toHaveBeenCalledTimes(4);
	});

	it('retries a transport error', async () => {
		let calls = 0;
		const body = await Effect.runPromise(
			fetchAndRead(
				url,
				readText,
				ports(() => {
					calls += 1;
					return calls < 2 ? Promise.reject(new Error('ECONNRESET')) : Promise.resolve(ok());
				}),
				options
			)
		);
		expect(body).toBe('hi');
	});

	it('retries a body that fails mid-read', async () => {
		let calls = 0;
		const read = (response: Response) => {
			calls += 1;
			return calls < 2 ? Promise.reject(new Error('truncated')) : response.text();
		};
		const body = await Effect.runPromise(
			fetchAndRead(
				url,
				read,
				ports(() => Promise.resolve(ok('whole'))),
				options
			)
		);
		expect(body).toBe('whole');
	});

	it('cancels a timed-out request through the abort signal it handed out', async () => {
		let aborted = false;
		const failure = await Effect.runPromise(
			Effect.flip(
				fetchAndRead(
					url,
					readText,
					ports(
						(_url, signal) =>
							new Promise((_resolve, reject) => {
								signal.addEventListener('abort', () => {
									aborted = true;
									reject(new Error('aborted'));
								});
							})
					),
					{ ...options, retries: 0 }
				)
			)
		);
		expect(aborted).toBe(true);
		expect(failure.message).toContain('no response in 200ms');
	});

	it('times out even when the transport ignores the abort signal', async () => {
		const failure = await Effect.runPromise(
			Effect.flip(
				fetchAndRead(
					url,
					readText,
					ports(() => new Promise(() => undefined)),
					{
						...options,
						retries: 0
					}
				)
			)
		);
		expect(failure).toMatchObject({ _tag: 'NetworkFailure', url });
	});
});

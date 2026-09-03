/**
 * SPIKE — one behavioural suite, run against both implementations of
 * ./contract.ts. If these pass for both, the two are interchangeable and the
 * choice between them is about cost and readability, not capability.
 */
import { describe, expect, it, vi } from 'vitest';
import type { DownloadPorts, DownloadOptions, MakeDownloadAll } from './contract.js';
import { makeDownloadAll as effectImpl } from './effect-impl.js';
import { makeDownloadAll as plainImpl } from './plain-impl.js';

const options: DownloadOptions = {
	concurrency: 8,
	retries: 3,
	attemptTimeoutMs: 200,
	backoffBaseMs: 5
};

const task = (n: number) => ({
	url: `https://example.com/${n}.png`,
	dir: '/icons',
	filename: `${n}.png`
});

const body = new Uint8Array([1, 2, 3]);
const ok = () => new Response(body as unknown as BodyInit, { status: 200 });
const status = (code: number) => new Response(null, { status: code });

/** Collects what was written so a test can assert on the effects, not the calls. */
const recordingPorts = (get: DownloadPorts['get']) => {
	const written: string[] = [];
	const ports: DownloadPorts = {
		get,
		write: (path) => {
			written.push(path);
		}
	};
	return { ports, written };
};

/** A request that never settles until its caller aborts it. */
const neverSettles = (_url: string, signal: AbortSignal): Promise<Response> =>
	new Promise((_resolve, reject) => {
		signal.addEventListener('abort', () => {
			reject(new Error('aborted'));
		});
	});

const implementations: readonly (readonly [string, MakeDownloadAll])[] = [
	['effect', effectImpl],
	['plain', plainImpl]
];

describe.each(implementations)('downloadAll (%s)', (_name, makeDownloadAll) => {
	it('writes each fetched icon to dir/filename', async () => {
		const { ports, written } = recordingPorts(() => Promise.resolve(ok()));
		const failures = await makeDownloadAll(ports, options)([task(1), task(2)]);
		expect(failures).toEqual([]);
		expect([...written].sort()).toEqual(['/icons/1.png', '/icons/2.png']);
	});

	it('reports a 404 as a non-retryable http failure naming the url', async () => {
		const { ports } = recordingPorts(() => Promise.resolve(status(404)));
		const failures = await makeDownloadAll(ports, options)([task(1)]);
		expect(failures).toEqual([
			{ kind: 'http', url: 'https://example.com/1.png', detail: 'status 404', retryable: false }
		]);
	});

	it('does not retry a 404 — the icon plan is wrong, not the network', async () => {
		const get = vi.fn(() => Promise.resolve(status(404)));
		const { ports } = recordingPorts(get);
		await makeDownloadAll(ports, options)([task(1)]);
		expect(get).toHaveBeenCalledTimes(1);
	});

	it('retries a 503 and succeeds once the host recovers', async () => {
		let calls = 0;
		const { ports, written } = recordingPorts(() => {
			calls += 1;
			return Promise.resolve(calls < 3 ? status(503) : ok());
		});
		const failures = await makeDownloadAll(ports, options)([task(1)]);
		expect(failures).toEqual([]);
		expect(written).toEqual(['/icons/1.png']);
	});

	it('gives up after the retry budget and reports the last failure', async () => {
		const get = vi.fn(() => Promise.resolve(status(503)));
		const { ports } = recordingPorts(get);
		const failures = await makeDownloadAll(ports, options)([task(1)]);
		// The first attempt plus the three retries the options allow.
		expect(get).toHaveBeenCalledTimes(4);
		expect(failures).toHaveLength(1);
	});

	it('abandons an attempt that never responds, and reports it', async () => {
		const { ports } = recordingPorts(neverSettles);
		const failures = await makeDownloadAll(ports, { ...options, retries: 0 })([task(1)]);
		expect(failures).toMatchObject([{ kind: 'network', url: 'https://example.com/1.png' }]);
	});

	it('holds requests to the concurrency cap instead of firing all at once', async () => {
		let inFlight = 0;
		let peak = 0;
		const { ports } = recordingPorts(async () => {
			inFlight += 1;
			peak = Math.max(peak, inFlight);
			await new Promise((resolve) => setTimeout(resolve, 5));
			inFlight -= 1;
			return ok();
		});
		await makeDownloadAll(ports, options)(Array.from({ length: 40 }, (_, i) => task(i)));
		expect(peak).toBe(options.concurrency);
	});

	it('reports every failure rather than only the first', async () => {
		const { ports } = recordingPorts((url) =>
			Promise.resolve(url.endsWith('/2.png') || url.endsWith('/4.png') ? status(404) : ok())
		);
		const failures = await makeDownloadAll(ports, options)([1, 2, 3, 4, 5].map(task));
		expect(failures.map((failure) => failure.url).sort()).toEqual([
			'https://example.com/2.png',
			'https://example.com/4.png'
		]);
	});

	it('still writes the icons that did succeed alongside a failure', async () => {
		const { ports, written } = recordingPorts((url) =>
			Promise.resolve(url.endsWith('/2.png') ? status(404) : ok())
		);
		await makeDownloadAll(ports, options)([1, 2, 3].map(task));
		expect([...written].sort()).toEqual(['/icons/1.png', '/icons/3.png']);
	});

	it('reports a write failure without retrying it', async () => {
		const get = vi.fn(() => Promise.resolve(ok()));
		const ports: DownloadPorts = {
			get,
			write: () => {
				throw new Error('EACCES');
			}
		};
		const failures = await makeDownloadAll(ports, options)([task(1)]);
		expect(failures).toMatchObject([{ kind: 'write', detail: 'EACCES', retryable: false }]);
		expect(get).toHaveBeenCalledTimes(1);
	});
});

describe('divergence between the two implementations', () => {
	/**
	 * The plain version's timeout is an `AbortController` the transport has to
	 * honour. A transport that ignores its signal — a stubborn native addon, a
	 * mock, a `fetch` polyfill — hangs the build with no timeout at all, which
	 * is the failure mode `attemptTimeoutMs` exists to prevent. Effect's timeout
	 * is enforced by the runtime interrupting the fiber, so it holds regardless
	 * of whether the transport cooperates.
	 */
	const ignoresAbort = (): Promise<Response> => new Promise(() => undefined);

	it('effect times out even when the transport ignores the abort signal', async () => {
		const { ports } = recordingPorts(ignoresAbort);
		const failures = await effectImpl(ports, { ...options, retries: 0 })([task(1)]);
		expect(failures).toMatchObject([{ kind: 'network' }]);
	});

	it('plain does not — it waits on a promise that never settles', async () => {
		const { ports } = recordingPorts(ignoresAbort);
		const race = await Promise.race([
			plainImpl(ports, { ...options, retries: 0 })([task(1)]).then(() => 'settled' as const),
			new Promise<'still-waiting'>((resolve) => setTimeout(() => resolve('still-waiting'), 600))
		]);
		expect(race).toBe('still-waiting');
	});
});

import { describe, expect, it, vi } from 'vitest';
import { Effect } from 'effect';
import { downloadAll, downloadIcon, type DownloadOptions, type DownloadPorts } from './download.js';

// Backoff is scaled down so the retry tests cost milliseconds, not seconds.
const options: DownloadOptions = {
	concurrency: 8,
	retries: 3,
	attemptTimeoutMs: 200,
	backoffBaseMs: 1
};

const task = (n: number) => ({
	url: `https://example.com/${n}.png`,
	dir: '/icons',
	filename: `${n}.png`
});

const body = new Uint8Array([1, 2, 3]);
const ok = () => new Response(body as unknown as BodyInit, { status: 200 });
const status = (code: number) => new Response(null, { status: code });

/** Records what was written, so tests assert on effects rather than on calls. */
const recordingPorts = (get: DownloadPorts['get']) => {
	const written: [string, Uint8Array][] = [];
	const ports: DownloadPorts = {
		get,
		write: (path, bytes) => {
			written.push([path, bytes]);
		}
	};
	return { ports, written };
};

const paths = (written: readonly [string, Uint8Array][]) => written.map(([path]) => path).sort();

describe('downloadIcon', () => {
	it('writes the fetched bytes to dir/filename', async () => {
		const { ports, written } = recordingPorts(() => Promise.resolve(ok()));
		await Effect.runPromise(downloadIcon(task(1), ports, options));
		expect(written).toEqual([['/icons/1.png', body]]);
	});

	it('reports a failed write without retrying the download', async () => {
		const get = vi.fn(() => Promise.resolve(ok()));
		const ports: DownloadPorts = {
			get,
			write: () => {
				throw new Error('EACCES');
			}
		};
		const failure = await Effect.runPromise(Effect.flip(downloadIcon(task(1), ports, options)));
		expect(failure).toMatchObject({ _tag: 'WriteFailure', path: '/icons/1.png' });
		expect(failure.message).toContain('EACCES');
		expect(get).toHaveBeenCalledTimes(1);
	});
});

describe('downloadAll', () => {
	it('writes every icon and succeeds when all of them fetch', async () => {
		const { ports, written } = recordingPorts(() => Promise.resolve(ok()));
		await Effect.runPromise(downloadAll([1, 2, 3].map(task), ports, options));
		expect(paths(written)).toEqual(['/icons/1.png', '/icons/2.png', '/icons/3.png']);
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
		await Effect.runPromise(
			downloadAll(
				Array.from({ length: 40 }, (_, i) => task(i)),
				ports,
				options
			)
		);
		expect(peak).toBe(options.concurrency);
	});

	it('names every failed icon, not just the first', async () => {
		const { ports } = recordingPorts((url) =>
			Promise.resolve(url.endsWith('/2.png') || url.endsWith('/4.png') ? status(404) : ok())
		);
		const failure = await Effect.runPromise(
			Effect.flip(downloadAll([1, 2, 3, 4, 5].map(task), ports, options))
		);
		expect(failure.failures).toHaveLength(2);
		expect(failure.message).toContain('/2.png');
		expect(failure.message).toContain('/4.png');
	});

	it('still writes the icons that did succeed alongside a failure', async () => {
		const { ports, written } = recordingPorts((url) =>
			Promise.resolve(url.endsWith('/2.png') ? status(404) : ok())
		);
		await Effect.runPromise(Effect.ignore(downloadAll([1, 2, 3].map(task), ports, options)));
		expect(paths(written)).toEqual(['/icons/1.png', '/icons/3.png']);
	});

	it('succeeds on an empty batch', async () => {
		const get = vi.fn(() => Promise.resolve(ok()));
		const { ports } = recordingPorts(get);
		await Effect.runPromise(downloadAll([], ports, options));
		expect(get).not.toHaveBeenCalled();
	});
});

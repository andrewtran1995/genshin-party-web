import { describe, expect, it, vi } from 'vitest';
import { downloadAll, downloadIcon } from './download.js';

const okResponse = (body: Uint8Array): Response =>
	new Response(body as unknown as BodyInit, { status: 200 });
const notFoundResponse = (): Response => new Response(null, { status: 404 });

const baseTask = {
	type: 'image' as const,
	url: 'https://example.com/x.png',
	dir: '/icons',
	filename: 'x.png'
};

const emptyDeps = () => ({
	fetch: vi.fn(),
	existsSync: vi.fn(),
	mkdirSync: vi.fn(),
	writeFileSync: vi.fn()
});

describe('downloadIcon', () => {
	it('skips existing files', async () => {
		const deps = emptyDeps();
		deps.existsSync.mockReturnValue(true);
		await downloadIcon(baseTask, deps);
		expect(deps.fetch).not.toHaveBeenCalled();
	});

	it('downloads and writes a missing file', async () => {
		const body = new Uint8Array([1, 2, 3]);
		const deps = emptyDeps();
		deps.existsSync.mockReturnValue(false);
		deps.fetch.mockResolvedValue(okResponse(body));
		await downloadIcon(baseTask, deps);
		expect(deps.fetch).toHaveBeenCalledWith('https://example.com/x.png');
		expect(deps.writeFileSync).toHaveBeenCalledWith('/icons/x.png', body);
	});

	it('throws on non-OK response', async () => {
		const deps = emptyDeps();
		deps.existsSync.mockReturnValue(false);
		deps.fetch.mockResolvedValue(notFoundResponse());
		await expect(downloadIcon(baseTask, deps)).rejects.toThrow('Failed to fetch');
	});
});

describe('downloadAll', () => {
	it('throws after a single failure', async () => {
		const deps = emptyDeps();
		deps.existsSync.mockReturnValue(false);
		deps.fetch.mockRejectedValue(new Error('network'));
		await expect(downloadAll([baseTask], deps)).rejects.toThrow('network');
		expect(deps.fetch).toHaveBeenCalledTimes(1);
	});

	it('downloads even if file exists when force is true', async () => {
		const body = new Uint8Array([1]);
		const deps = emptyDeps();
		deps.existsSync.mockReturnValue(true);
		deps.fetch.mockResolvedValue(okResponse(body));
		await downloadAll([baseTask], deps, true);
		expect(deps.fetch).toHaveBeenCalled();
	});
});

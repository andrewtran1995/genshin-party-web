/**
 * SPIKE — not wired into `pnpm gen:data`. See ./README.md.
 *
 * The contract both implementations in this directory satisfy. It is the
 * icon-download pipeline `scripts/lib/download.ts` already performs, plus the
 * four guarantees that file does not have and arguably should:
 *
 *   1. retry transient failures (one flaky 5xx currently fails the whole build)
 *   2. cap concurrency (`Promise.all` fires all ~58 boss icons at one host)
 *   3. bound each attempt (a hung socket currently hangs the build forever)
 *   4. report every failure, not just whichever one rejected first
 *
 * Holding both implementations to this one interface is what makes the
 * comparison in the ADR fair: the question is not whether Effect can do this,
 * it is what the same guarantees cost with and without it.
 */
import type { DownloadTask } from '../../lib/icon-plan.js';

export interface DownloadPorts {
	/** Receives an `AbortSignal` so an abandoned attempt can cancel its request. */
	readonly get: (url: string, signal: AbortSignal) => Promise<Response>;
	readonly write: (path: string, bytes: Uint8Array) => void;
}

export interface DownloadFailure {
	readonly kind: 'http' | 'network' | 'write';
	readonly url: string;
	readonly detail: string;
	/**
	 * A 5xx or a transport error is worth another go; a 404 means the icon plan
	 * is wrong about which file exists, and retrying only slows the build down
	 * before it fails anyway. The current `throw new Error(...)` cannot express
	 * this distinction — every failure looks the same to a caller.
	 */
	readonly retryable: boolean;
}

export interface DownloadOptions {
	readonly concurrency: number;
	/** Extra attempts after the first, for retryable failures only. */
	readonly retries: number;
	readonly attemptTimeoutMs: number;
	readonly backoffBaseMs: number;
}

/** Runs every task and resolves with the ones that failed. Never rejects. */
export type DownloadAll = (tasks: readonly DownloadTask[]) => Promise<readonly DownloadFailure[]>;

export type MakeDownloadAll = (ports: DownloadPorts, options: DownloadOptions) => DownloadAll;

const describe = (cause: unknown): string =>
	cause instanceof Error ? cause.message : String(cause);

export const httpFailure = (url: string, status: number): DownloadFailure => ({
	kind: 'http',
	url,
	detail: `status ${status}`,
	retryable: status >= 500
});

export const networkFailure = (url: string, cause: unknown): DownloadFailure => ({
	kind: 'network',
	url,
	detail: describe(cause),
	retryable: true
});

export const writeFailure = (url: string, cause: unknown): DownloadFailure => ({
	kind: 'write',
	url,
	detail: describe(cause),
	retryable: false
});

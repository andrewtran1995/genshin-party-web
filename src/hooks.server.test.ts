import { describe, expect, it, vi } from 'vitest';
import { handleError } from './hooks.server';
import type { RequestEvent } from '@sveltejs/kit';

describe('handleError', () => {
	it('logs the error and returns a generic message with a fresh error id', () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const error = new Error('boom');

		const result = handleError({
			error,
			event: {} as RequestEvent,
			status: 500,
			message: 'Internal Error'
		});

		expect(result).toMatchObject({ message: 'An unexpected error occurred.' });
		expect(result).toHaveProperty('errorId');
		expect(typeof (result as { errorId: string }).errorId).toBe('string');
		expect(consoleError).toHaveBeenCalledWith(
			expect.stringContaining((result as { errorId: string }).errorId),
			error
		);

		consoleError.mockRestore();
	});

	it('assigns a different error id to each call', () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		const first = handleError({
			error: new Error('a'),
			event: {} as RequestEvent,
			status: 500,
			message: 'Internal Error'
		});
		const second = handleError({
			error: new Error('b'),
			event: {} as RequestEvent,
			status: 500,
			message: 'Internal Error'
		});

		expect((first as { errorId: string }).errorId).not.toBe(
			(second as { errorId: string }).errorId
		);

		consoleError.mockRestore();
	});
});

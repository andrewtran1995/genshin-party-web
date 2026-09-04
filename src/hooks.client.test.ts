import { describe, expect, it, vi } from 'vitest';
import { handleError } from './hooks.client';
import type { NavigationEvent } from '@sveltejs/kit';

describe('handleError', () => {
	it('logs the error and returns a generic message with a fresh error id', () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const error = new Error('boom');

		const result = handleError({
			error,
			event: {} as NavigationEvent,
			status: 500,
			message: 'Internal Error'
		});

		expect(result).toMatchObject({ message: 'An unexpected error occurred.' });
		expect(typeof (result as { errorId: string }).errorId).toBe('string');
		expect(consoleError).toHaveBeenCalledWith(
			expect.stringContaining((result as { errorId: string }).errorId),
			error
		);

		consoleError.mockRestore();
	});
});

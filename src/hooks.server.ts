import type { HandleServerError } from '@sveltejs/kit';

export const handleError: HandleServerError = ({ error }) => {
	const errorId = crypto.randomUUID();

	console.error(`[${errorId}]`, error);

	return { message: 'An unexpected error occurred.', errorId };
};

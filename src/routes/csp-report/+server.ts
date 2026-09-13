import type { RequestHandler } from './$types';

// Browsers POST violation reports here for the report-only policy in
// `svelte.config.js`. Logged, not stored — this is observability for tuning
// the directives before switching to an enforced policy, not an audit trail.
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.text();
	console.warn('[csp-report]', body);

	return new Response(null, { status: 204 });
};

/**
 * SvelteKit's `vite preview` resolves a request path to a prerendered file
 * on disk with `decodeURI`, not `decodeURIComponent` (see
 * `@sveltejs/kit/src/exports/vite/preview/index.js`). `decodeURI`
 * deliberately refuses to decode escapes for URI-reserved characters
 * (`, ; : @ & = + $`), so a name percent-encoded with plain
 * `encodeURIComponent` — which escapes all of those — 404s against a build
 * even though the page prerendered fine (e.g. "Lupus Boreas, Dominator of
 * Wolves"). Those characters are valid literal characters within a single
 * path segment (RFC 3986 `pchar`), so leave them un-escaped instead of
 * relying on a decode step that won't undo them. (Whether the real Vercel
 * deploy has the same defect is unconfirmed — see bounty 007's findings log.)
 */
export const encodePathSegment = (value: string): string =>
	encodeURIComponent(value).replace(/%(2C|3B|3A|40|26|3D|2B|24)/gi, (_match, hex: string) =>
		String.fromCharCode(parseInt(hex, 16))
	);

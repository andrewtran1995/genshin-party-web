import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		experimental: {
			remoteFunctions: true,
			// Renders a hover-preloaded page off-screen so committing the
			// navigation is near-instant. Benefits nav-bar/picker-tile links,
			// which are the ones hover-preload can predict; roll buttons
			// navigate to a random destination it can't predict in advance.
			forkPreloads: true
		},
		// Report-only: observe real traffic before enforcing. SvelteKit can't
		// emit a Content-Security-Policy-Report-Only header for prerendered
		// pages (no meta-tag equivalent exists), so this only covers dynamic
		// routes and form actions for now — see bounty-board issue #86.
		csp: {
			reportOnly: {
				'default-src': ['self'],
				// Skeleton/Tailwind and several components (tilt effect, card
				// art positioning) set inline `style` attributes with values
				// computed at runtime, which can't be hashed at build time.
				'style-src': ['self', 'unsafe-inline'],
				// Svelte 5's SSR output adds `onload="this.__e=event"` /
				// `onerror="this.__e=event"` to any element with those handlers, to
				// replay events that fired before hydration attached the real
				// listener (see the <img> in CardChrome.svelte). Framework-authored
				// and always this exact literal, so it's hashed rather than allowing
				// every inline attribute handler.
				'script-src-attr': ['unsafe-hashes', 'sha256-7dQwUgLau1NFCCGjfn9FsYptB6ZtWxJin6VohGIu20I='],
				// enka.network serves character splash art; upload-os-bbs.mihoyo.com
				// is the icon fallback used when a character has no splash art yet
				// (data: covers the inline favicon in app.html).
				'img-src': ['self', 'data:', 'https://enka.network', 'https://upload-os-bbs.mihoyo.com'],
				'object-src': ['none'],
				'base-uri': ['self'],
				'report-uri': ['/csp-report']
			}
		}
	}
};

export default config;

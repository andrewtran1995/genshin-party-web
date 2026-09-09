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
		}
	}
};

export default config;

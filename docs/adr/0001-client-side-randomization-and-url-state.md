# Move randomization to the client and use URL-based state for result pages

We will move randomization out of SvelteKit form actions and API endpoints into the browser, using the build-time-extracted dataset. Results will be represented in the URL so each result page can be shared and can be pre-rendered where feasible.

This lets us eliminate server actions and make most result pages pre-rendered, shareable, and CDN-cacheable, while keeping the heavy `genshin-db` dependency out of the runtime bundle. The trade-off is that the trimmed dataset must be shipped to the client.

To preserve progressive enhancement, each entry form keeps a thin server action fallback. Without JavaScript, the form POSTs to the action, which picks a result using the same client-safe randomizer and redirects to the result URL. With JavaScript, the client intercepts the submit and navigates locally instead.

## Pre-rendered vs dynamic result pages

- `/char/[name]` and `/order/[permutation]` are pre-rendered (small, finite URL spaces).
- `/boss/[name]` (single boss) is pre-rendered (58 pages).
- `/boss/[a]/[b]/[c]` (three-boss gauntlet) is dynamic. Pre-rendering all 30,856 possible 3-boss combinations would exceed practical build and deployment limits, so this route is server-rendered while still using URL-based state.

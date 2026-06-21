<svelte:head>
	<title>Interactive party — genshin-party</title>
</svelte:head>

<h1>Interactive party selection</h1>

<p>
	Will balance 4★/5★ across four players, matching <code>genshin-party interactive</code>.
</p>

<!--
	TODO: implement the interactive flow.
	- Port the xstate machine from `genshin-party/src/player-selection-stack.ts`
	  into `$lib/player-selection-stack.ts` (client-side only).
	- Add a server endpoint (e.g. GET /api/random-char) that calls into the
	  $lib/server/genshin-db helpers for one random Char at a given rarity.
	- This page drives the actor, fetches candidates, and renders Accept /
	  Accept-as-main / Reroll / Go-back controls per the CLI behaviour.
	- See docs/architecture.md for the full flow.
-->

<p><em>Not yet implemented.</em></p>

<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>genshin-party</title>
</svelte:head>

<h1>genshin-party</h1>

<p>
	Random pickers for Genshin Impact multiplayer sessions. The web counterpart to the
	<a href="https://www.npmjs.com/package/genshin-party"><code>genshin-party</code></a> CLI.
</p>

<ul>
	<li><a href={resolve('/char')}>Random character</a> — element/rarity filters.</li>
	<li><a href={resolve('/boss')}>Random boss</a> — single or three-boss gauntlet.</li>
	<li><a href={resolve('/order')}>Random order</a> — shuffle four player numbers.</li>
	<li>
		<a href={resolve('/interactive')}>Interactive party</a> — guided 4-player roll with mains.
	</li>
</ul>

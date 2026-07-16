<script lang="ts">
	import { resolve } from '$app/paths';
	import Link from '$lib/components/Link.svelte';
</script>

<svelte:head>
	<title>genshin-party</title>
</svelte:head>

<h1>genshin-party</h1>

<p>
	Random pickers for Genshin Impact multiplayer sessions. The web counterpart to the
	<Link href="https://www.npmjs.com/package/genshin-party"><code>genshin-party</code></Link> CLI.
</p>

<ul>
	<li><Link href={resolve('/char')}>Random character</Link> — element/rarity filters.</li>
	<li><Link href={resolve('/boss')}>Random boss</Link> — single or three-boss gauntlet.</li>
	<li><Link href={resolve('/order')}>Random order</Link> — shuffle four player numbers.</li>
	<li>
		<Link href={resolve('/interactive')}>Interactive party</Link> — guided 4-player roll with mains.
	</li>
</ul>

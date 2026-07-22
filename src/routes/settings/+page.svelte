<script lang="ts">
	import { resolve } from '$app/paths';
	import Link from '$lib/components/Link.svelte';
	import PresetManager from '$lib/components/PresetManager.svelte';
	import { createPresetStore } from '$lib/player-presets.svelte';

	const store = createPresetStore();
</script>

<svelte:head>
	<title>Settings — genshin-party</title>
</svelte:head>

<div class="stacked">
	<h1>Settings</h1>
	<p>
		Save a preset party of player names. Your default preset pre-fills the
		<Link href={resolve('/interactive')}>interactive party</Link> form. Presets are stored in this browser
		only.
	</p>

	<PresetManager {store} />
</div>

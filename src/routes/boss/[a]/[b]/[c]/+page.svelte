<script lang="ts">
	import { resolve } from '$app/paths';
	import BossCard from '$lib/components/BossCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Boss gauntlet — genshin-party</title>
</svelte:head>

<h1>Random boss gauntlet</h1>

{#if data.weekly}
	<p>Filter: Weekly bosses only</p>
{/if}

<ul class="bosses">
	{#each data.bosses as boss (boss.name)}
		<li><BossCard {boss} /></li>
	{/each}
</ul>

<p>
	<a href={resolve('/boss')}>Roll again</a>
</p>

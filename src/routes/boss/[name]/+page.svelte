<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import BossCard from '$lib/components/BossCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchParams = $state(new URLSearchParams(''));

	function updateSearchParams() {
		searchParams = new URLSearchParams(window.location.search);
	}

	afterNavigate(updateSearchParams);
	const weekly = $derived(searchParams.get('weekly') === '1');
	const mismatch = $derived(
		(() => {
			if (weekly && data.boss.categoryType !== 'CODEX_SUBTYPE_BOSS') return true;
			return false;
		})()
	);
</script>

<svelte:head>
	<title>{data.boss.name} — genshin-party</title>
</svelte:head>

<h1>Random boss</h1>

{#if weekly}
	<p>Filter: Weekly bosses only</p>
{/if}

{#if mismatch}
	<p class="error" role="alert">This boss does not match the requested filter.</p>
{/if}

<BossCard boss={data.boss} />

<p>
	<a href={resolve('/boss')}>Roll again</a>
</p>

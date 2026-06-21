<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Random order — genshin-party</title>
</svelte:head>

<h1>Random selection order</h1>

<form method="POST">
	<button type="submit">Shuffle</button>
</form>

{#if form?.order}
	<ol>
		{#each form.order as player (player)}
			<li>Player {player}</li>
		{/each}
	</ol>
{/if}

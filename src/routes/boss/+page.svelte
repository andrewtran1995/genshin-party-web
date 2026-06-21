<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Random boss — genshin-party</title>
</svelte:head>

<h1>Random boss</h1>

<form method="POST">
	<label>
		<input type="checkbox" name="gauntlet" />
		Gauntlet (3 bosses)
	</label>

	<label>
		<input type="checkbox" name="weekly" checked value="on" />
		Weekly bosses only
	</label>

	<button type="submit">Roll</button>
</form>

{#if form && 'picks' in form}
	<section>
		<h2>{form.gauntlet ? 'Gauntlet' : 'Boss'}</h2>
		{#each form.picks as boss (boss.name)}
			<article>
				<h3>{boss.name}</h3>
				<p>{boss.description}</p>
			</article>
		{/each}
	</section>
{:else if form && 'error' in form}
	<p role="alert">{form.error}</p>
{/if}

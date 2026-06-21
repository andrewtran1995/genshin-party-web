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

{#if form?.todo}
	<p>{form.todo}</p>
{/if}

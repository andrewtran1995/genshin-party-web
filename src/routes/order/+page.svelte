<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { sample } from '$lib/genshin';

	let clientError = $state('');

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		clientError = '';
		const order = sample([1, 2, 3, 4], 4).join(',');
		void goto(resolve(`/order/${order}`));
	}
</script>

<svelte:head>
	<title>Random order — genshin-party</title>
</svelte:head>

<div class="stacked">
	<h1>Random selection order</h1>

	<p class="lede">Shuffle four player numbers into a random pick order.</p>

	<form method="POST" onsubmit={handleSubmit}>
		<button class="btn btn-primary btn-wide" type="submit">Shuffle</button>
	</form>

	{#if clientError}
		<p class="error" role="alert">{clientError}</p>
	{/if}
</div>

<style>
	.lede {
		margin: 0;
		color: var(--ink-muted);
	}
</style>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { rollOrderUrl } from '$lib/genshin';

	let clientError = $state('');

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		clientError = '';
		void goto(resolve(rollOrderUrl() as Pathname));
	}
</script>

<svelte:head>
	<title>Random order — genshin-party</title>
</svelte:head>

<h1>Random selection order</h1>

<form class="stacked" method="POST" onsubmit={handleSubmit}>
	<p class="intro">Shuffle four player numbers into a random pick order.</p>
	<button class="btn preset-filled-primary-500 w-full sm:w-auto" type="submit">Shuffle</button>
</form>

{#if clientError}
	<p class="error" role="alert">{clientError}</p>
{/if}

<style>
	.intro {
		opacity: 0.75;
	}
</style>

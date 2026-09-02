<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { rollOrderUrl } from '$lib/genshin/order';
	import { rollOrder } from './order.remote';
</script>

<svelte:head>
	<title>Random order — genshin-party</title>
</svelte:head>

<h1>Random selection order</h1>

<form
	class="stacked"
	{...rollOrder.enhance(async () => {
		await goto(resolve(rollOrderUrl() as Pathname));
	})}
>
	<p class="intro">Shuffle four player numbers into a random pick order.</p>
	<button class="btn preset-filled-primary-500 w-full sm:w-auto" type="submit">Shuffle</button>
</form>

<style>
	.intro {
		opacity: 0.75;
	}
</style>

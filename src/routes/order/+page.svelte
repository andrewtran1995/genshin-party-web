<script lang="ts">
	import { goto, preloadCode } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { allPermutations, rollOrderUrl } from '$lib/genshin/order';
	import { rollOrder } from './order.remote';

	// All /order/[permutation] results share one chunk, so any valid
	// permutation warms it.
	function warmResultRoute() {
		const [first] = allPermutations();
		if (!first) return;
		void preloadCode(`/order/${first.join(',')}`).catch(() => undefined);
	}
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
	<button
		class="btn preset-filled-primary-500 w-full sm:w-auto"
		type="submit"
		onmouseenter={warmResultRoute}
		onfocus={warmResultRoute}
	>
		Shuffle
	</button>
</form>

<style>
	.intro {
		opacity: 0.75;
	}
</style>

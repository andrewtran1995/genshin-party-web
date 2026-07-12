<script lang="ts">
	import type { Enemy } from '$lib/types';

	let { boss }: { boss: Enemy } = $props();
</script>

<article class="boss-card">
	<h3>{boss.name}</h3>
	<p>{boss.description}</p>
</article>

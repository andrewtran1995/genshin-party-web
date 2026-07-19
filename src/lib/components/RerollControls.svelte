<script lang="ts">
	import { resolve } from '$app/paths';
	import Link from './Link.svelte';
	import type { Pathname } from '$app/types';

	interface Props {
		/** Entry form to reroll against. Its action re-rolls without JS. */
		entry: Pathname;
		/** Filters that produced the current result. Empty values are omitted. */
		criteria: Record<string, string>;
		onreroll: () => void;
	}

	let { entry, criteria, onreroll }: Props = $props();

	const action = $derived(resolve(entry));

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		onreroll();
	}
</script>

<form class="reroll-controls" method="POST" {action} onsubmit={handleSubmit}>
	{#each Object.entries(criteria) as [name, value] (name)}
		{#if value}
			<input type="hidden" {name} {value} />
		{/if}
	{/each}
	<button class="reroll btn preset-filled-primary-500" type="submit">Reroll</button>
	<Link class="change-criteria" href={action}>Change criteria</Link>
</form>

<style>
	.reroll-controls {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: stretch;
	}

	.reroll {
		width: 100%;
	}

	.reroll-controls :global(.change-criteria) {
		font-size: 0.875rem;
		text-align: center;
	}

	@media (width >= 30rem) {
		.reroll-controls {
			flex-direction: row;
			align-items: center;
			justify-content: center;
		}

		.reroll {
			width: auto;
		}
	}
</style>

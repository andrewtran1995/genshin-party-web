<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { ActionData } from './$types';
	import { getRandomBoss, getRandomBosses } from '$lib/genshin';

	let { form }: { form: ActionData } = $props();
	let clientError = $state('');

	function buildQuery(weekly: boolean) {
		return weekly ? '?weekly=1' : '';
	}

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		clientError = '';

		const data = new FormData(event.currentTarget as HTMLFormElement);
		const gauntlet = data.has('gauntlet');
		const weekly = data.has('weekly');

		if (gauntlet) {
			const bosses = getRandomBosses({ weekly }, 3);
			if (bosses.length === 0) {
				clientError = 'No bosses match those filters.';
				return;
			}
			const names = bosses.map((boss) => boss.name);
			void goto(resolve(`/boss/${names.map(encodeURIComponent).join('/')}${buildQuery(weekly)}`));
		} else {
			const boss = getRandomBoss({ weekly });
			if (!boss) {
				clientError = 'No bosses match those filters.';
				return;
			}
			void goto(resolve(`/boss/${encodeURIComponent(boss.name)}${buildQuery(weekly)}`));
		}
	}
</script>

<svelte:head>
	<title>Random boss — genshin-party</title>
</svelte:head>

<h1>Random boss</h1>

<form class="stacked" method="POST" onsubmit={handleSubmit}>
	<div class="toggle-group">
		<label class="toggle-row">
			<input class="checkbox" type="checkbox" name="gauntlet" />
			<span>Gauntlet (3 bosses)</span>
		</label>

		<label class="toggle-row">
			<input class="checkbox" type="checkbox" name="weekly" checked value="on" />
			<span>Weekly bosses only</span>
		</label>
	</div>

	<button class="btn preset-filled-primary-500 w-full sm:w-auto" type="submit">Roll</button>
</form>

{#if clientError || form?.error}
	<p class="error" role="alert">{clientError || form?.error}</p>
{/if}

<style>
	.toggle-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* The whole row is the tap target, not just the tick box. */
	.toggle-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-height: 2.75rem;
		padding: 0.5rem 0.85rem;
		border: var(--default-border-width) solid var(--color-surface-200);
		border-radius: var(--radius-base);
		cursor: pointer;
	}

	.toggle-row:has(input:checked) {
		border-color: var(--color-primary-500);
		background: color-mix(in oklch, var(--color-primary-500) 12%, transparent);
	}

	.toggle-row:focus-within {
		outline: var(--default-ring-width) solid var(--color-primary-500);
		outline-offset: 2px;
	}

	@media (prefers-color-scheme: dark) {
		.toggle-row {
			border-color: var(--color-surface-800);
		}
	}
</style>

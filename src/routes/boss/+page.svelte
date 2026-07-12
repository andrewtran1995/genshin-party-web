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

<form method="POST" onsubmit={handleSubmit}>
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

{#if clientError || form?.error}
	<p class="error" role="alert">{clientError || form?.error}</p>
{/if}

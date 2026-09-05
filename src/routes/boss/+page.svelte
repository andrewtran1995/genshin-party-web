<script lang="ts">
	import { goto, preloadCode } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import type { ActionData } from './$types';
	import {
		BOSS_ERROR,
		GAUNTLET_SIZE,
		getAllBossNames,
		rollBossUrl,
		parseBossFilters
	} from '$lib/genshin/bosses';
	import { encodePathSegment } from '$lib/genshin/path-segment';

	let { form }: { form: ActionData } = $props();
	let clientError = $state('');
	let gauntlet = $state(false);

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		clientError = '';

		const data = new FormData(event.currentTarget as HTMLFormElement);
		const { gauntlet: isGauntlet, weekly } = parseBossFilters(data);
		const url = rollBossUrl({ gauntlet: isGauntlet, weekly });
		if (!url) {
			clientError = BOSS_ERROR;
			return;
		}
		void goto(resolve(url as Pathname));
	}

	// A gauntlet roll lands on /boss/[a]/[b]/[c]; a single roll lands on
	// /boss/[name]. Those are different route chunks, so warm the one the
	// current toggle state will actually navigate to.
	function warmResultRoute() {
		const names = getAllBossNames();
		if (!gauntlet) {
			const name = names[0];
			if (!name) return;
			void preloadCode(`/boss/${encodePathSegment(name)}`).catch(() => undefined);
			return;
		}
		if (names.length < GAUNTLET_SIZE) return;
		const path = names
			.slice(0, GAUNTLET_SIZE)
			.map((name) => encodePathSegment(name))
			.join('/');
		void preloadCode(`/boss/${path}`).catch(() => undefined);
	}
</script>

<svelte:head>
	<title>Random boss — genshin-party</title>
</svelte:head>

<h1>Random boss</h1>

<form class="stacked" method="POST" onsubmit={handleSubmit}>
	<div class="toggle-group">
		<label class="toggle-row">
			<input class="checkbox" type="checkbox" name="gauntlet" bind:checked={gauntlet} />
			<span>Gauntlet (3 bosses)</span>
		</label>

		<label class="toggle-row">
			<input class="checkbox" type="checkbox" name="weekly" checked value="on" />
			<span>Weekly bosses only</span>
		</label>
	</div>

	<button
		class="btn preset-filled-primary-500 w-full sm:w-auto"
		type="submit"
		onmouseenter={warmResultRoute}
		onfocus={warmResultRoute}
	>
		Roll
	</button>
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

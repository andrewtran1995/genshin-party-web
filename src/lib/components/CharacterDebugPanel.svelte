<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { getCharByName } from '$lib/genshin/characters';
	import { encodePathSegment } from '$lib/genshin/path-segment';

	let { characters, error }: { characters: { name: string }[]; error?: string | undefined } =
		$props();

	let selectedCharacter = $state('');
	let clientError = $state('');

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		clientError = '';

		const formData = new FormData(event.currentTarget as HTMLFormElement);
		const name = formData.get('character');
		if (typeof name !== 'string' || !getCharByName(name)) {
			clientError = 'Select a character.';
			return;
		}

		void goto(resolve(`/char/${encodePathSegment(name)}?allVariants=1` as Pathname));
	}
</script>

<section class="stacked debug-section" aria-labelledby="debug-heading">
	<h2 id="debug-heading" class="h4">Debug: view a specific character</h2>
	<p class="text-sm opacity-75">Pick a character and render every card variant side-by-side.</p>

	<form class="stacked" method="POST" action="?/debug" onsubmit={handleSubmit}>
		<label class="label">
			<span class="label-text">Character:</span>
			<select class="select" name="character" bind:value={selectedCharacter}>
				<option value="">Select a character</option>
				{#each characters as character (character.name)}
					<option value={character.name}>{character.name}</option>
				{/each}
			</select>
		</label>

		<button class="btn preset-filled-secondary-500 w-full sm:w-auto" type="submit">
			Show all variants
		</button>
	</form>

	{#if clientError || error}
		<p class="error" role="alert">{clientError || error}</p>
	{/if}
</section>

<style>
	.debug-section {
		margin-top: var(--stack-gap, 1.5rem);
		padding-top: var(--stack-gap, 1.5rem);
		border-top: 1px solid var(--color-surface-200);
	}

	@media (prefers-color-scheme: dark) {
		.debug-section {
			border-color: var(--color-surface-800);
		}
	}
</style>

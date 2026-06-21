<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createPlayerSelectionStackActor } from '$lib/player-selection-stack';
	import type { Char, PlayerChoice } from '$lib/types';

	let actor = $state<ReturnType<typeof createPlayerSelectionStackActor> | null>(null);
	let playerChoices = $state<PlayerChoice[]>([]);
	let playerOrder = $state<number[]>([]);
	let status = $state<'idle' | 'rolling' | 'awaiting' | 'done'>('idle');
	let candidate = $state<Char | null>(null);
	let error = $state<string | null>(null);
	let onlyTeyvat = $state(true);
	let unique = $state(true);

	const currentPlayer = $derived(playerOrder[playerChoices.length]);
	const nextRarity = $derived(playerChoices.at(-1)?.isMain ? '4' : '5');

	async function rollCandidate(): Promise<void> {
		status = 'rolling';
		error = null;
		while (status === 'rolling') {
			const url = new URL('/api/random-char', window.location.origin);
			url.searchParams.set('rarity', nextRarity);
			url.searchParams.set('onlyTeyvat', String(onlyTeyvat));
			const res = await fetch(url);
			const body = (await res.json()) as { char?: Char; error?: string };
			if (!res.ok || !body.char) {
				error = body.error ?? 'Failed to roll.';
				status = 'awaiting';
				return;
			}
			if (unique && playerChoices.some((c) => c.char.name === body.char?.name)) {
				continue;
			}
			candidate = body.char;
			status = 'awaiting';
			return;
		}
	}

	function accept(isMain: boolean): void {
		if (!candidate || currentPlayer === undefined) return;
		actor?.send({
			type: 'push',
			choice: { char: candidate, isMain, number: currentPlayer }
		});
		candidate = null;
	}

	function reroll(): void {
		void rollCandidate();
	}

	function goBack(): void {
		actor?.send({ type: 'pop' });
		candidate = null;
	}

	function start(): void {
		actor?.stop();
		const next = createPlayerSelectionStackActor();
		next.subscribe((snapshot) => {
			playerChoices = snapshot.context.playerChoices;
			playerOrder = snapshot.context.playerOrder;
			if (snapshot.status === 'done') {
				status = 'done';
				candidate = null;
			}
		});
		next.start();
		actor = next;
		void rollCandidate();
	}

	onMount(start);

	onDestroy(() => actor?.stop());

	const lastChoice = $derived(playerChoices.at(-1));
</script>

<svelte:head>
	<title>Interactive party — genshin-party</title>
</svelte:head>

<h1>Interactive party selection</h1>

<p>Balances 4★/5★ across four players. Mark a roll as a "main" to spend a 5★ slot.</p>

<fieldset>
	<legend>Options</legend>
	<label>
		<input type="checkbox" bind:checked={onlyTeyvat} />
		Only Teyvat (exclude Aloy &amp; Lumine)
	</label>
	<label>
		<input type="checkbox" bind:checked={unique} />
		Unique (no duplicates)
	</label>
	<button type="button" onclick={start}>Restart</button>
</fieldset>

{#if status === 'done'}
	<h2>Final party</h2>
	<ol>
		{#each playerChoices.toSorted((a, b) => a.number - b.number) as choice (choice.number)}
			<li>
				Player {choice.number}: <strong>{choice.char.name}</strong>
				({choice.char.rarity}★ · {choice.char.elementType}){choice.isMain ? ' — main' : ''}
			</li>
		{/each}
	</ol>
{:else}
	<section>
		<h2>Choosing for Player {currentPlayer}</h2>
		<p>Next roll: {nextRarity}★</p>

		{#if status === 'rolling'}
			<p>Rolling…</p>
		{:else if candidate}
			<p>
				Rolled: <strong>{candidate.name}</strong>
				({candidate.rarity}★ · {candidate.elementType})
			</p>
			<button
				type="button"
				onclick={() => {
					accept(false);
				}}
			>
				Accept
			</button>
			<button
				type="button"
				onclick={() => {
					accept(true);
				}}
				disabled={playerChoices.length === 3}
			>
				Accept as main
			</button>
			<button type="button" onclick={reroll}>Reroll</button>
			{#if lastChoice}
				<button type="button" onclick={goBack}>Go back to Player {lastChoice.number}</button>
			{/if}
		{/if}

		{#if error}
			<p role="alert">{error}</p>
		{/if}
	</section>

	{#if playerChoices.length > 0}
		<aside>
			<h3>So far</h3>
			<ul>
				{#each playerChoices as choice (choice.number)}
					<li>
						Player {choice.number}: {choice.char.name}{choice.isMain ? ' (main)' : ''}
					</li>
				{/each}
			</ul>
		</aside>
	{/if}
{/if}

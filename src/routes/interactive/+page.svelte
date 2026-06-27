<script lang="ts">
	import type { Char } from '$lib/types';
	import { expandPlayerNames, formatPlayer } from '$lib/player-names';
	import { createPlayerSelectionStackActor, type PlayerChoice } from '$lib/player-selection-stack';

	let playerNamesRaw = $state('');
	let expandedNames = $state<string[]>([]);
	let actor = $state<ReturnType<typeof createPlayerSelectionStackActor> | undefined>();
	let snapshot = $state<
		ReturnType<ReturnType<typeof createPlayerSelectionStackActor>['getSnapshot']> | undefined
	>();
	let currentPlayerNumber = $state<number | undefined>();
	let candidate = $state<Char | undefined>();
	let discardedChoice = $state<PlayerChoice | undefined>();
	let loading = $state(false);
	let error = $state<string | undefined>();

	const isDone = $derived(snapshot?.status === 'done');
	const canGoBack = $derived((snapshot?.context.playerChoices.length ?? 0) > 0);
	const isFinalPick = $derived((snapshot?.context.playerChoices.length ?? 0) === 3);
	const finalChoices = $derived(
		snapshot?.status === 'done'
			? [...snapshot.context.playerChoices].sort((a, b) => a.number - b.number)
			: []
	);
	const lastChoice = $derived(snapshot?.context.playerChoices.at(-1));

	function start() {
		expandedNames = expandPlayerNames(playerNamesRaw);
		const newActor = createPlayerSelectionStackActor({
			input: {
				onNewChoiceFunction(playerNumber) {
					currentPlayerNumber = playerNumber;
					queueMicrotask(() => void fetchCandidate(newActor));
				}
			}
		});
		actor = newActor;
		snapshot = newActor.getSnapshot();
		newActor.subscribe((next) => {
			snapshot = next;
		});
		newActor.start();
	}

	async function fetchCandidate(actorRef = actor) {
		if (!actorRef) return;
		loading = true;
		error = undefined;

		if (discardedChoice) {
			candidate = discardedChoice.char;
			discardedChoice = undefined;
			loading = false;
			return;
		}

		const { playerChoices } = actorRef.getSnapshot().context;
		const rarity = playerChoices.at(-1)?.isMain ? '4' : '5';
		const exclude = playerChoices.map((choice) => choice.char.name).join(',');
		const url = `/api/random-char?rarity=${rarity}&exclude=${encodeURIComponent(exclude)}`;

		try {
			const response = await fetch(url);
			if (!response.ok) {
				error = 'No eligible character.';
				candidate = undefined;
			} else {
				candidate = (await response.json()) as Char;
			}
		} catch {
			error = 'Failed to fetch character.';
			candidate = undefined;
		} finally {
			loading = false;
		}
	}

	function accept(isMain: boolean) {
		if (!actor || !candidate || currentPlayerNumber === undefined) return;
		actor.send({
			choice: { char: candidate, isMain, number: currentPlayerNumber },
			type: 'push'
		});
		candidate = undefined;
	}

	function acceptNormal() {
		accept(false);
	}

	function acceptAsMain() {
		accept(true);
	}

	function reroll() {
		candidate = undefined;
		void fetchCandidate();
	}

	function goBack() {
		if (!actor || !snapshot) return;
		const lastChoice = snapshot.context.playerChoices.at(-1);
		if (!lastChoice) return;
		discardedChoice = lastChoice;
		actor.send({ type: 'pop' });
		candidate = undefined;
	}

	function reset() {
		actor?.stop();
		actor = undefined;
		snapshot = undefined;
		currentPlayerNumber = undefined;
		candidate = undefined;
		discardedChoice = undefined;
		loading = false;
		error = undefined;
	}
</script>

<svelte:head>
	<title>Interactive party — genshin-party</title>
</svelte:head>

<h1>Interactive party selection</h1>

{#if !actor}
	<form
		method="dialog"
		onsubmit={(event) => {
			event.preventDefault();
			start();
		}}
	>
		<label>
			Player names (comma-separated):
			<input bind:value={playerNamesRaw} placeholder="e.g. A, B, C, D" type="text" />
		</label>
		<button type="submit">Start</button>
	</form>
{:else if isDone}
	<h2>Chosen characters</h2>

	<ul>
		{#each finalChoices as choice (choice.number)}
			<li>
				<strong>{formatPlayer(choice.number, expandedNames)}:</strong>
				{choice.char.name} ({choice.char.rarity}★ {choice.char.elementText})
			</li>
		{/each}
	</ul>

	<button type="button" onclick={reset}>Start over</button>
{:else}
	{#if currentPlayerNumber !== undefined}
		<p>Now choosing for {formatPlayer(currentPlayerNumber, expandedNames)}.</p>
	{/if}

	{#if loading}
		<p aria-live="polite">Rolling…</p>
	{:else if error}
		<p class="error" role="alert">{error}</p>
	{:else if candidate}
		<figure class="char">
			{#if candidate.portrait}
				<img alt={candidate.name} loading="lazy" src={candidate.portrait} width="240" />
			{/if}
			<figcaption>
				<strong>{candidate.name}</strong>
				<span>{candidate.rarity}★ {candidate.elementText} · {candidate.weaponText}</span>
				{#if candidate.title}<span class="title">{candidate.title}</span>{/if}
				{#if candidate.region}<span class="region">{candidate.region}</span>{/if}
			</figcaption>
		</figure>
	{/if}

	<div class="controls">
		<button disabled={!candidate || loading} onclick={acceptNormal} type="button">Accept</button>
		<button disabled={!candidate || loading || isFinalPick} onclick={acceptAsMain} type="button">
			Accept as main
		</button>
		<button disabled={loading} onclick={reroll} type="button">Reroll</button>
		<button disabled={!canGoBack || loading} onclick={goBack} type="button">
			{#if lastChoice}
				Go back to {formatPlayer(lastChoice.number, expandedNames)}
			{:else}
				Go back
			{/if}
		</button>
	</div>
{/if}

<style>
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
</style>

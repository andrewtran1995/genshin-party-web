<script lang="ts">
	import InteractiveFlow from '$lib/components/InteractiveFlow.svelte';
	import { expandPlayerNames } from '$lib/player-names';
	import { createPartyFlow } from '$lib/party-flow.svelte';

	const flow = createPartyFlow();
	let expandedNames = $state<string[]>([]);

	function start(playerNames: string[]) {
		expandedNames = expandPlayerNames(playerNames);
		flow.start();
	}

	function reset() {
		expandedNames = [];
		flow.reset();
	}
</script>

<svelte:head>
	<title>Interactive party — genshin-party</title>
</svelte:head>

<h1>Interactive party selection</h1>

<InteractiveFlow
	flowState={flow.state}
	{expandedNames}
	onstart={start}
	onaccept={flow.accept}
	onreroll={flow.roll}
	ongoback={flow.goBack}
	onreset={reset}
/>

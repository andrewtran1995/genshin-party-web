<script lang="ts">
	import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
	import CharVariantGallery from '$lib/components/CharVariantGallery.svelte';
	import type { Char } from '$lib/types';

	let { char, onclose }: { char: Char | undefined; onclose: () => void } = $props();
</script>

<Dialog
	open={char !== undefined}
	onOpenChange={(details) => {
		if (!details.open) onclose();
	}}
>
	<Portal>
		<Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50" />
		<Dialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center p-4">
			<Dialog.Content
				class="card bg-surface-100-900 max-h-[90vh] w-full max-w-3xl overflow-y-auto p-4 shadow-xl sm:p-6"
			>
				{#if char}
					<div class="stacked">
						<div class="flex justify-end">
							<Dialog.CloseTrigger
								class="btn-icon preset-tonal-surface"
								aria-label="Close all variants"
							>
								<svg
									class="size-5 shrink-0"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									aria-hidden="true"
								>
									<path stroke-linecap="round" d="M6 6l12 12M18 6l-12 12" />
								</svg>
							</Dialog.CloseTrigger>
						</div>
						<CharVariantGallery {char} />
					</div>
				{/if}
			</Dialog.Content>
		</Dialog.Positioner>
	</Portal>
</Dialog>

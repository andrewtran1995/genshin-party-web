<script lang="ts">
	import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
	import NavLink from './NavLink.svelte';

	interface NavItem {
		href: string;
		label: string;
	}

	let { navItems }: { navItems: NavItem[] } = $props();

	let open = $state(false);

	const animBackdrop =
		'transition transition-discrete opacity-0 starting:data-[state=open]:opacity-0 data-[state=open]:opacity-100';
	const animDrawer =
		'transition transition-discrete opacity-0 -translate-x-full starting:data-[state=open]:opacity-0 starting:data-[state=open]:-translate-x-full data-[state=open]:opacity-100 data-[state=open]:translate-x-0';
</script>

<Dialog {open} onOpenChange={(details) => (open = details.open)}>
	<Dialog.Trigger class="btn-icon preset-tonal-surface md:hidden" aria-label="Open navigation menu">
		<svg
			class="size-5 shrink-0"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"
		>
			<path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16" />
		</svg>
	</Dialog.Trigger>
	<Portal>
		<Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50 {animBackdrop}" />
		<Dialog.Positioner class="fixed inset-0 z-50 flex justify-start">
			<Dialog.Content
				class="card bg-surface-100-900 h-screen w-64 max-w-[80vw] space-y-4 p-4 shadow-xl {animDrawer}"
			>
				<header class="flex items-center justify-between">
					<Dialog.Title class="text-lg font-bold">Menu</Dialog.Title>
					<Dialog.CloseTrigger
						class="btn-icon preset-tonal-surface"
						aria-label="Close navigation menu"
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
				</header>
				<nav class="flex flex-col gap-1">
					{#each navItems as item (item.href)}
						<NavLink href={item.href} onclick={() => (open = false)}>{item.label}</NavLink>
					{/each}
				</nav>
			</Dialog.Content>
		</Dialog.Positioner>
	</Portal>
</Dialog>

<script lang="ts">
	import { page } from '$app/state';

	interface Props {
		href: string;
		class?: string;
		children?: import('svelte').Snippet;
	}

	let { href, class: className = '', children }: Props = $props();

	// Mark the link for the current section so the active page reads at a glance.
	// Home only matches exactly; section links also match their sub-routes.
	const isActive = $derived(
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href)
	);
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<a
	{href}
	class={`appbar-link${className ? ` ${className}` : ''}${isActive ? ' is-active' : ''}`}
	aria-current={isActive ? 'page' : undefined}
>
	{@render children?.()}
</a>

<!-- eslint-enable svelte/no-navigation-without-resolve -->

<style>
	.appbar-link {
		display: inline-flex;
		align-items: center;
		min-height: 2.5rem;
		padding-inline: 0.25rem;
	}

	.appbar-link.is-active {
		font-weight: 600;
		color: var(--anchor-font-color);
		text-decoration: underline;
		text-decoration-color: var(--anchor-font-color);
		text-underline-offset: 0.3em;
	}
</style>

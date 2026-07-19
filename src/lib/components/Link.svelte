<script lang="ts">
	interface Props {
		href: string;
		class?: string;
		children?: import('svelte').Snippet;
	}

	let { href, class: className = '', children }: Props = $props();

	const isExternal = $derived(
		href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')
	);
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<a
	{href}
	class={className}
	target={isExternal ? '_blank' : undefined}
	rel={isExternal ? 'noopener noreferrer' : undefined}
>
	{@render children?.()}
</a>
<!-- eslint-enable svelte/no-navigation-without-resolve -->

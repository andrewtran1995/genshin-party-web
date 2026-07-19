<script lang="ts">
	interface Props {
		href: string;
		class?: string;
		children?: import('svelte').Snippet;
	}

	let { href, class: className = '', children }: Props = $props();
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<a {href} class={className ? `appbar-link ${className}` : 'appbar-link'}>
	{@render children?.()}
</a>
<!-- eslint-enable svelte/no-navigation-without-resolve -->

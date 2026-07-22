<script lang="ts">
	import { ELEMENT_ACCENT_COLORS } from '$lib/icon-tables';

	const wedges = Object.values(ELEMENT_ACCENT_COLORS);
	const step = 360 / wedges.length;
	const gradient = $derived(
		`conic-gradient(${wedges.map((color, i) => `${color} ${i * step}deg ${(i + 1) * step}deg`).join(', ')})`
	);
</script>

<span class="any-element-icon" style:background={gradient} aria-hidden="true"></span>

<style>
	.any-element-icon {
		width: 1em;
		height: 1em;
		display: block;
		flex: none;
		border-radius: 50%;
	}
</style>

import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import NavDrawer from './NavDrawer.svelte';

const navItems = [
	{ href: '/char', label: 'Character' },
	{ href: '/boss', label: 'Boss' }
];

// The dialog trigger lives in the render container, but its content is
// teleported to `document.body` by `Portal` — so every query below reads
// from `document.body`, not the container `render` returns.
const trigger = () => {
	const button = document.body.querySelector<HTMLElement>('[aria-label="Open navigation menu"]');
	if (!button) throw new Error('Expected the drawer trigger');
	return button;
};

const dialog = () => document.body.querySelector<HTMLElement>('[role="dialog"]');

const focusable = () => {
	const content = dialog();
	if (!content) throw new Error('Expected the dialog to be open');
	return [...content.querySelectorAll<HTMLElement>('a[href], button')];
};

describe('NavDrawer', () => {
	it('traps focus while open, closes on Escape, and restores focus to the trigger', async () => {
		render(NavDrawer, { props: { navItems } });

		trigger().click();

		await expect.poll(() => dialog()?.getAttribute('data-state')).toBe('open');
		await expect.poll(() => dialog()?.contains(document.activeElement)).toBe(true);

		// Tabbing forward from the last focusable element wraps back inside the
		// dialog instead of escaping to the rest of the page.
		focusable().at(-1)?.focus();
		await userEvent.keyboard('{Tab}');
		expect(dialog()?.contains(document.activeElement)).toBe(true);

		await userEvent.keyboard('{Escape}');

		await expect.poll(() => dialog()?.getAttribute('data-state')).toBe('closed');
		await expect.poll(() => document.activeElement).toBe(trigger());
	});
});

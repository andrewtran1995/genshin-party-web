import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

vi.mock('$app/environment', () => ({ browser: true }));

import PresetManager from './PresetManager.svelte';
import { createPresetStore } from '$lib/player-presets.svelte';

// Set a bound <input>/<select> value the way a user typing would.
const type = (input: HTMLInputElement, value: string) => {
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true }));
};

const button = (container: HTMLElement, label: string) => {
	const match = [...container.querySelectorAll<HTMLButtonElement>('button')].find(
		(b) => b.textContent.trim() === label
	);
	if (!match) throw new Error(`No button labelled "${label}"`);
	return match;
};

const req = <T>(value: T | null | undefined): T => {
	if (value == null) throw new Error('expected a value');
	return value;
};

const nameInput = (container: HTMLElement) =>
	req(container.querySelector<HTMLInputElement>('.preset-editor .field input'));

const playerInputs = (container: HTMLElement) => [
	...container.querySelectorAll<HTMLInputElement>('.player-inputs input')
];

describe('PresetManager', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('creates a preset from the editor and lists it', async () => {
		const store = createPresetStore();
		const { container } = await render(PresetManager, { props: { store } });

		type(nameInput(container), 'Weeknight crew');
		type(req(playerInputs(container)[0]), 'Ann');
		button(container, 'Add player').click();
		await expect.poll(() => playerInputs(container)).toHaveLength(2);
		type(req(playerInputs(container)[1]), 'Bob');

		button(container, 'Add preset').click();

		await expect.poll(() => container.querySelectorAll('.preset-row')).toHaveLength(2);
		expect(container.textContent).toContain('Weeknight crew');
		expect(container.textContent).toContain('Ann, Bob');
		expect(store.presets).toHaveLength(1);
	});

	it('rejects a preset with no name', async () => {
		const store = createPresetStore();
		const { container } = await render(PresetManager, { props: { store } });

		type(req(playerInputs(container)[0]), 'Ann');
		button(container, 'Add preset').click();

		await expect
			.poll(() => container.querySelector('[role="alert"]')?.textContent)
			.toMatch(/name/i);
		expect(store.presets).toHaveLength(0);
	});

	it('sets a preset as the default via its radio', async () => {
		const store = createPresetStore();
		const id = store.add('Crew', ['Ann']);
		const { container } = await render(PresetManager, { props: { store } });

		const radios = [...container.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
		// [0] is the "None" option; [1] is the first preset.
		req(radios[1]).click();

		await expect.poll(() => store.defaultId).toBe(id);
		expect(container.textContent).toContain('Default');
	});

	it('edits an existing preset', async () => {
		const store = createPresetStore();
		store.add('Crew', ['Ann']);
		const { container } = await render(PresetManager, { props: { store } });

		button(container, 'Edit').click();
		await expect.poll(() => nameInput(container).value).toBe('Crew');
		type(nameInput(container), 'Renamed crew');
		button(container, 'Save changes').click();

		await expect.poll(() => req(store.presets[0]).name).toBe('Renamed crew');
	});

	it('deletes a preset', async () => {
		const store = createPresetStore();
		store.add('Crew', ['Ann']);
		const { container } = await render(PresetManager, { props: { store } });

		button(container, 'Delete').click();

		await expect.poll(() => store.presets).toHaveLength(0);
		expect(container.textContent).toContain('No saved parties yet');
	});
});

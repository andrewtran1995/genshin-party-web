import { describe, expect, it } from 'vitest';
import type { Char } from '$lib/types';
import { getChars } from '$lib/server/genshin';
import { GET } from './+server';
import type { RequestEvent } from './$types';

const makeRequest = (search: string) =>
	GET({ url: new URL(`http://localhost/api/random-char?${search}`) } as RequestEvent);

describe('GET /api/random-char', () => {
	it('returns a character by default', async () => {
		const response = await makeRequest('');
		expect(response.status).toBe(200);

		const char = (await response.json()) as Char;
		expect(char).toHaveProperty('name');
		expect(char).toHaveProperty('rarity');
	});

	it('filters by rarity', async () => {
		const response = await makeRequest('rarity=5');
		expect(response.status).toBe(200);

		const char = (await response.json()) as Char;
		expect(char.rarity).toBe(5);
	});

	it('excludes characters by name', async () => {
		const allNames = getChars().map((char) => char.name);
		const excludedNames = allNames.slice(0, -1);
		const response = await makeRequest(`exclude=${encodeURIComponent(excludedNames.join(','))}`);
		expect(response.status).toBe(200);

		const char = (await response.json()) as Char;
		expect(excludedNames).not.toContain(char.name);
	});

	it('excludes Aloy and Lumine by default (onlyTeyvat=true)', async () => {
		const allNames = getChars().map((char) => char.name);
		const exclude = allNames.filter((name) => name !== 'Aloy').join(',');
		const response = await makeRequest(`exclude=${encodeURIComponent(exclude)}`);
		expect(response.status).toBe(404);
	});

	it('includes Aloy when onlyTeyvat=false', async () => {
		const allNames = getChars().map((char) => char.name);
		const exclude = allNames.filter((name) => name !== 'Aloy').join(',');
		const response = await makeRequest(`onlyTeyvat=false&exclude=${encodeURIComponent(exclude)}`);
		expect(response.status).toBe(200);

		const char = (await response.json()) as Char;
		expect(char.name).toBe('Aloy');
	});

	it('returns 404 when no characters are eligible', async () => {
		const allNames = getChars().map((char) => char.name);
		const response = await makeRequest(`exclude=${encodeURIComponent(allNames.join(','))}`);
		expect(response.status).toBe(404);

		const body = (await response.json()) as { error: string };
		expect(body.error).toBe('No eligible character.');
	});
});

import { describe, expect, it } from 'vitest';
import { Effect } from 'effect';
import { decodeMonsterIcons, fetchMonsterIcons, YATTA_MONSTER_URL } from './yatta.js';
import type { HttpPorts, RequestOptions } from './http.js';

const options: RequestOptions = { retries: 0, attemptTimeoutMs: 200, backoffBaseMs: 1 };

const payload = (items: Record<string, unknown>) => ({ response: 200, data: { items } });

const lawachurl = { id: 21010101, name: 'Stonehide Lawachurl', icon: 'UI_Monster_Lawachurl' };

const jsonPorts = (value: unknown): HttpPorts => ({
	get: () => Promise.resolve(new Response(JSON.stringify(value), { status: 200 }))
});

describe('decodeMonsterIcons', () => {
	it('indexes monster icons by id', async () => {
		const icons = await Effect.runPromise(decodeMonsterIcons(payload({ '21010101': lawachurl })));
		expect(icons.get(21010101)).toBe('UI_Monster_Lawachurl');
	});

	it('rejects a monster whose icon field went missing', async () => {
		const failure = await Effect.runPromise(
			Effect.flip(decodeMonsterIcons(payload({ '1': { id: 1, name: 'Boss' } })))
		);
		expect(failure.message).toContain('icon');
	});

	it('rejects a payload whose items moved off `data`', async () => {
		const failure = await Effect.runPromise(
			Effect.flip(decodeMonsterIcons({ response: 200, data: { monsters: {} } }))
		);
		expect(failure.message).toContain('items');
	});

	it('names every bad monster, not just the first', async () => {
		const failure = await Effect.runPromise(
			Effect.flip(
				decodeMonsterIcons(
					payload({
						'1': lawachurl,
						'2': { id: 2, name: 'B' },
						'3': { id: 3, name: 'C', icon: 99 }
					})
				)
			)
		);
		expect(failure.message).toMatch(/2[\s\S]*3/);
	});
});

describe('fetchMonsterIcons', () => {
	it('reads the index from the Yatta endpoint', async () => {
		const icons = await Effect.runPromise(
			fetchMonsterIcons(jsonPorts(payload({ '21010101': lawachurl })), options)
		);
		expect(icons.get(21010101)).toBe('UI_Monster_Lawachurl');
	});

	it('reports an unreachable host as unavailable, naming the url', async () => {
		const failure = await Effect.runPromise(
			Effect.flip(fetchMonsterIcons({ get: () => Promise.reject(new Error('ENOTFOUND')) }, options))
		);
		expect(failure._tag).toBe('YattaUnavailable');
		expect(failure.message).toContain(YATTA_MONSTER_URL);
	});

	it('reports a changed response shape as unavailable rather than an empty map', async () => {
		const failure = await Effect.runPromise(
			Effect.flip(fetchMonsterIcons(jsonPorts({ response: 200, data: { monsters: {} } }), options))
		);
		expect(failure.message).toContain('unexpected response shape');
	});
});

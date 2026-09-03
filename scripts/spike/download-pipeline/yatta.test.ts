/** SPIKE — one suite, both implementations of ./yatta-contract.ts. */
import { describe, expect, it } from 'vitest';
import type { DecodeMonsterIcons } from './yatta-contract.js';
import { decodeMonsterIcons as effectImpl } from './yatta-effect.js';
import { decodeMonsterIcons as plainImpl } from './yatta-plain.js';

const payload = (items: Record<string, unknown>) => ({ response: 200, data: { items } });

const implementations: readonly (readonly [string, DecodeMonsterIcons])[] = [
	['effect', effectImpl],
	['plain', plainImpl]
];

describe.each(implementations)('decodeMonsterIcons (%s)', (_name, decodeMonsterIcons) => {
	it('indexes monster icons by id', () => {
		const result = decodeMonsterIcons(
			payload({
				'21010101': { id: 21010101, name: 'Stonehide Lawachurl', icon: 'UI_Monster_Lawachurl' }
			})
		);
		expect(result.ok && result.icons.get(21010101)).toBe('UI_Monster_Lawachurl');
	});

	it('rejects a monster whose icon field went missing', () => {
		const result = decodeMonsterIcons(payload({ '1': { id: 1, name: 'Boss' } }));
		expect(result.ok ? '' : result.error).toContain('icon');
	});

	it('rejects a payload whose items moved off `data`', () => {
		const result = decodeMonsterIcons({ response: 200, data: { monsters: {} } });
		expect(result.ok ? '' : result.error).toContain('items');
	});

	it('names every bad monster, not just the first', () => {
		const result = decodeMonsterIcons(
			payload({
				'1': { id: 1, name: 'A', icon: 'ok' },
				'2': { id: 2, name: 'B' },
				'3': { id: 3, name: 'C', icon: 99 }
			})
		);
		expect(result.ok ? '' : result.error).toMatch(/2[\s\S]*3/);
	});
});

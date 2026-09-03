/** SPIKE — the hand-written implementation of ./yatta-contract.ts. */
import type { DecodeMonsterIcons, DecodeResult } from './yatta-contract.js';

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

export const decodeMonsterIcons: DecodeMonsterIcons = (payload) => {
	if (!isRecord(payload)) return { ok: false, error: 'expected an object at the root' };
	if (!isRecord(payload['data'])) return { ok: false, error: 'expected `data` to be an object' };
	const items = payload['data']['items'];
	if (!isRecord(items)) return { ok: false, error: 'expected `data.items` to be an object' };

	const icons = new Map<number, string>();
	const problems: string[] = [];
	for (const [key, item] of Object.entries(items)) {
		if (!isRecord(item)) {
			problems.push(`data.items.${key}: expected an object`);
			continue;
		}
		const { id, icon } = item;
		if (typeof id !== 'number') problems.push(`data.items.${key}.id: expected a number`);
		if (typeof icon !== 'string') problems.push(`data.items.${key}.icon: expected a string`);
		if (typeof id === 'number' && typeof icon === 'string') icons.set(id, icon);
	}
	return problems.length > 0
		? ({ ok: false, error: problems.join('\n') } satisfies DecodeResult)
		: ({ ok: true, icons } satisfies DecodeResult);
};

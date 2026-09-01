import { describe, expect, it } from 'vitest';
import { sample } from './sample';

describe('sample', () => {
	it('returns the requested count of distinct items', () => {
		const picked = sample([1, 2, 3, 4, 5], 3);
		expect(picked).toHaveLength(3);
		expect(new Set(picked).size).toBe(3);
	});

	it('caps at the pool size', () => {
		expect(sample([1, 2], 5)).toHaveLength(2);
	});
});

import { describe, expect, it } from 'vitest';
import { allPermutations, isValidPermutation, rollOrderUrl } from './order';

describe('rollOrderUrl', () => {
	it('returns a valid permutation', () => {
		const url = rollOrderUrl();
		expect(url).toMatch(/^\/order\/[1-4](,[1-4]){3}$/);
		const permutation = url.replace('/order/', '');
		expect(isValidPermutation(permutation)).toBe(true);
	});

	it('excludes the current permutation when rerolling', () => {
		const current = '1,2,3,4';
		for (let i = 0; i < 50; i++) {
			const url = rollOrderUrl({ exclude: current });
			expect(url).not.toBe(`/order/${current}`);
		}
	});
});

describe('isValidPermutation', () => {
	it('accepts every valid permutation', () => {
		for (const order of allPermutations()) {
			expect(isValidPermutation(order.join(','))).toBe(true);
		}
	});

	it('rejects invalid permutations', () => {
		expect(isValidPermutation('1,2,3')).toBe(false);
		expect(isValidPermutation('1,2,3,3')).toBe(false);
		expect(isValidPermutation('1,2,3,5')).toBe(false);
		expect(isValidPermutation('1,2,3,a')).toBe(false);
	});
});

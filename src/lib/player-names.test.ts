import { describe, expect, it } from 'vitest';
import { expandPlayerNames, formatPlayer } from './player-names';

describe('expandPlayerNames', () => {
	it('returns an empty array for empty input', () => {
		expect(expandPlayerNames([])).toEqual([]);
	});

	it('returns an empty array when all names are whitespace-only', () => {
		expect(expandPlayerNames(['   ', '  '])).toEqual([]);
	});

	it('expands one name into four identical slots', () => {
		expect(expandPlayerNames(['A'])).toEqual(['A', 'A', 'A', 'A']);
	});

	it('expands two names into [a, a, b, b]', () => {
		expect(expandPlayerNames(['A', 'B'])).toEqual(['A', 'A', 'B', 'B']);
	});

	it('expands three names into [a, a, b, c]', () => {
		expect(expandPlayerNames(['A', 'B', 'C'])).toEqual(['A', 'A', 'B', 'C']);
	});

	it('keeps four names unchanged', () => {
		expect(expandPlayerNames(['A', 'B', 'C', 'D'])).toEqual(['A', 'B', 'C', 'D']);
	});

	it('trims whitespace around names', () => {
		expect(expandPlayerNames(['  A  ', '  B  '])).toEqual(['A', 'A', 'B', 'B']);
	});

	it('ignores blank entries when expanding', () => {
		expect(expandPlayerNames(['A', '', 'B'])).toEqual(['A', 'A', 'B', 'B']);
	});
});

describe('formatPlayer', () => {
	it('includes the name when available', () => {
		expect(formatPlayer(1, ['A', 'B', 'C', 'D'])).toBe('Player 1 (A)');
	});

	it('falls back to a plain label when the name is missing', () => {
		expect(formatPlayer(3, ['A', 'B'])).toBe('Player 3');
	});
});

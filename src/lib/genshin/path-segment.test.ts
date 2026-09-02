import { describe, expect, it } from 'vitest';
import { encodePathSegment } from './path-segment';
import { getAllBossNames } from './bosses';
import { getAllCharNames } from './characters';

describe('encodePathSegment', () => {
	it('round-trips every boss and character name through decodeURIComponent', () => {
		for (const name of [...getAllBossNames(), ...getAllCharNames()]) {
			expect(decodeURIComponent(encodePathSegment(name))).toBe(name);
		}
	});

	it('leaves URI-reserved characters `decodeURI` refuses to decode un-escaped', () => {
		expect(encodePathSegment('Lupus Boreas, Dominator of Wolves')).toBe(
			'Lupus%20Boreas,%20Dominator%20of%20Wolves'
		);
		expect(encodePathSegment('Lord of the Hidden Depths: Whisperer of Nightmares')).toBe(
			'Lord%20of%20the%20Hidden%20Depths:%20Whisperer%20of%20Nightmares'
		);
	});

	it('still escapes characters that would change path structure', () => {
		expect(encodePathSegment('a/b')).toBe('a%2Fb');
		expect(encodePathSegment('a?b')).toBe('a%3Fb');
		expect(encodePathSegment('a#b')).toBe('a%23b');
	});
});

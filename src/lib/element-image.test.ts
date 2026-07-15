import { describe, expect, it } from 'vitest';
import { getElementIconUrl } from './element-image';
import { elements } from './types';

describe('getElementIconUrl', () => {
	it('maps every real element to a local icon path', () => {
		for (const element of elements) {
			if (element === 'none') {
				expect(getElementIconUrl(element)).toBeUndefined();
			} else {
				expect(getElementIconUrl(element)).toBe(`/icons/elements/${element}.png`);
			}
		}
	});
});

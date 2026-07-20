import { describe, expect, it } from 'vitest';
import { getElementIconUrl, getWeaponIconUrl } from './icon-tables';
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

describe('getWeaponIconUrl', () => {
	it('maps known weapon types to local icon paths', () => {
		expect(getWeaponIconUrl('Sword')).toBe('/icons/weapons/sword.png');
		expect(getWeaponIconUrl('CLAYMORE')).toBe('/icons/weapons/claymore.png');
		expect(getWeaponIconUrl('bow')).toBe('/icons/weapons/bow.png');
		expect(getWeaponIconUrl('Polearm')).toBe('/icons/weapons/polearm.png');
		expect(getWeaponIconUrl('Catalyst')).toBe('/icons/weapons/catalyst.png');
	});

	it('returns undefined for unknown weapons', () => {
		expect(getWeaponIconUrl('Axe')).toBeUndefined();
	});
});

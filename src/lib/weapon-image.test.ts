import { describe, expect, it } from 'vitest';
import { getWeaponIconUrl } from './weapon-image';

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

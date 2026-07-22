import { describe, expect, it } from 'vitest';
import { filterBossEnemies, trimBoss, trimCharacters } from './trim.js';

const baseChar = {
	id: 1,
	name: 'Traveler',
	title: 'Outlander',
	rarity: 5,
	elementType: 'ELEMENT_ANEMO',
	elementText: 'Anemo',
	weaponText: 'Sword',
	region: '',
	images: {}
};

const baseEnemy = {
	id: 1,
	name: 'Boss',
	description: 'Big baddie',
	categoryType: 'CODEX_SUBTYPE_BOSS',
	enemyType: 'BOSS',
	images: {}
};

describe('trimCharacters', () => {
	it('excludes Aether so Lumine is returned once', () => {
		const chars = [
			{ ...baseChar, id: 1, name: 'Aether' },
			{ ...baseChar, id: 2, name: 'Lumine' }
		];
		expect(trimCharacters(chars).map((c) => c.name)).toEqual(['Lumine']);
	});

	it('maps ELEMENT_* to lowercased element', () => {
		const chars = [{ ...baseChar, elementType: 'ELEMENT_PYRO' }];
		expect(trimCharacters(chars)[0].element).toBe('pyro');
	});

	it('uses filename_gachaSplash when available', () => {
		const chars = [
			{
				...baseChar,
				images: { filename_gachaSplash: 'UI_Gacha_AvatarImg_Diluc' }
			}
		];
		expect(trimCharacters(chars)[0].portrait).toBe(
			'https://enka.network/ui/UI_Gacha_AvatarImg_Diluc.png'
		);
	});

	it('falls back from filename_icon to the gacha splash filename', () => {
		const chars = [
			{
				...baseChar,
				name: 'Lumine',
				images: { filename_icon: 'UI_AvatarIcon_Lumine' }
			}
		];
		expect(trimCharacters(chars)[0].portrait).toBe(
			'https://enka.network/ui/UI_Gacha_AvatarImg_Lumine.png'
		);
	});

	it('returns undefined portrait when neither splash nor icon exists', () => {
		const chars = [baseChar];
		expect(trimCharacters(chars)[0].portrait).toBeUndefined();
	});
});

describe('filterBossEnemies', () => {
	it('excludes Stormterror', () => {
		const enemies = [
			{ ...baseEnemy, id: 1, name: 'Stormterror' },
			{ ...baseEnemy, id: 2, name: 'Andrius' }
		];
		expect(filterBossEnemies(enemies).map((e) => e.name)).toEqual(['Andrius']);
	});

	it('keeps enemies with enemyType BOSS', () => {
		const enemies = [{ ...baseEnemy, name: 'Regisvine', categoryType: 'NORMAL' }];
		expect(filterBossEnemies(enemies).map((e) => e.name)).toEqual(['Regisvine']);
	});

	it('keeps enemies with categoryType CODEX_SUBTYPE_BOSS', () => {
		const enemies = [
			{ ...baseEnemy, name: 'Azhdaha', categoryType: 'CODEX_SUBTYPE_BOSS', enemyType: 'NORMAL' }
		];
		expect(filterBossEnemies(enemies).map((e) => e.name)).toEqual(['Azhdaha']);
	});
});

describe('trimBoss', () => {
	it('attaches the resolved icon path', () => {
		const enemy = { ...baseEnemy, name: 'Andrius' };
		expect(trimBoss(enemy, '/icons/bosses/andrius.png').icon).toBe('/icons/bosses/andrius.png');
	});
});

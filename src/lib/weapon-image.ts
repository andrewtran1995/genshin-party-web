export const WEAPON_ICONS: Record<string, string | undefined> = {
	sword: '/icons/weapons/sword.png',
	claymore: '/icons/weapons/claymore.png',
	bow: '/icons/weapons/bow.png',
	polearm: '/icons/weapons/polearm.png',
	catalyst: '/icons/weapons/catalyst.png'
};

export const getWeaponIconUrl = (weapon: string): string | undefined =>
	WEAPON_ICONS[weapon.toLowerCase()];

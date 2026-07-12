import type { Enemy } from '$lib/types';

/** Returns the best available image URL for a boss enemy. */
export const getBossImageUrl = (boss: Enemy): string | undefined => boss.icon;

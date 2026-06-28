import type { Char } from '$lib/types';

/** Returns the best available image URL for a character: portrait first, then icon. */
export const getCharImageUrl = (char: Char): string | null => char.portrait ?? char.icon;

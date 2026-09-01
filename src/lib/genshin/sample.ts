import { shuffle } from 'remeda';

/** Pick `count` distinct random items. Returns fewer if the pool is smaller. */
export const sample = <T>(items: readonly T[], count = 1): T[] => shuffle(items).slice(0, count);

import { shuffle } from 'remeda';

export function pickRandom<T>(items: readonly T[]): T | undefined {
	if (items.length === 0) return undefined;
	return items[Math.floor(Math.random() * items.length)];
}

export function pickRandomN<T>(items: readonly T[], n: number): T[] {
	return shuffle([...items]).slice(0, n);
}

export function shuffled<T>(items: readonly T[]): T[] {
	return shuffle([...items]);
}

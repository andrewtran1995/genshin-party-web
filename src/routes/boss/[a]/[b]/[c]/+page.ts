import { error } from '@sveltejs/kit';
import type { Enemy } from '$lib/types';
import type { PageLoad } from './$types';
import { getBossByName } from '$lib/genshin/bosses';
import { parseCardVariantList } from '$lib/card-variant';

export const prerender = false;

export const load: PageLoad = ({ params, url }) => {
	const names = [params.a, params.b, params.c];
	const maybeBosses = names.map((name) => getBossByName(name));
	if (maybeBosses.some((boss) => !boss) || new Set(names).size !== names.length) {
		error(404, 'Bosses not found');
	}
	const bosses = maybeBosses.filter((boss): boss is Enemy => boss !== undefined);
	const weekly = url.searchParams.get('weekly') === '1';
	const variants = parseCardVariantList(url.searchParams.get('variant'), bosses.length);
	return { bosses, weekly, variants };
};

import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getAllBossNames, getBossByName } from '$lib/genshin/bosses';

export const prerender = true;

export const entries = () => getAllBossNames().map((name) => ({ name }));

export const load: PageLoad = ({ params }) => {
	const boss = getBossByName(params.name);
	if (!boss) error(404, 'Boss not found');
	return { boss };
};

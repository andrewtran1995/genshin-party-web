import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getAllCharNames, getCharByName } from '$lib/genshin/characters';

export const prerender = true;

export const entries = () => getAllCharNames().map((name) => ({ name }));

export const load: PageLoad = ({ params }) => {
	const char = getCharByName(params.name);
	if (!char) error(404, 'Character not found');
	return { char };
};

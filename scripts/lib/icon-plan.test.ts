import { describe, expect, it } from 'vitest';
import { planIconDownloads, plannedTasks, toBossIconSources, toIconSource } from './icon-plan.js';

const baseBoss = {
	id: 1,
	name: 'Andrius',
	description: '',
	categoryType: 'CODEX_SUBTYPE_BOSS',
	enemyType: 'BOSS',
	images: { filename_icon: 'andrius' }
};

const baseOptions = {
	iconsDir: '/tmp/icons/bosses',
	publicPath: '/icons/bosses',
	isIconDownloaded: () => false
};

describe('toBossIconSources', () => {
	it('prefers the Yatta filename as the first candidate', () => {
		const [source] = toBossIconSources([baseBoss], new Map([[1, 'yatta_andrius']]));
		expect(source.targets.map((target) => target.filename)).toEqual([
			'yatta_andrius.png',
			'andrius.png'
		]);
		expect(source.targets[0].url).toBe('https://gi.yatta.moe/assets/UI/monster/yatta_andrius.png');
	});

	it('dedupes identical candidates', () => {
		const [source] = toBossIconSources([baseBoss], new Map([[1, 'andrius']]));
		expect(source.targets).toHaveLength(1);
	});

	it('falls back to the genshin-db filename when Yatta is unavailable', () => {
		const [source] = toBossIconSources([baseBoss], new Map());
		expect(source.targets.map((target) => target.filename)).toEqual(['andrius.png']);
	});

	it('carries the boss through for later trimming', () => {
		const [source] = toBossIconSources([baseBoss], new Map());
		expect(source.boss).toBe(baseBoss);
	});
});

describe('toIconSource', () => {
	it('builds a single target named after the key', () => {
		expect(toIconSource('pyro', 'https://example.com/pyro.png').targets).toEqual([
			{ url: 'https://example.com/pyro.png', filename: 'pyro.png' }
		]);
	});

	it('yields no targets without a remote URL', () => {
		expect(toIconSource('pyro', undefined).targets).toEqual([]);
	});
});

describe('planIconDownloads', () => {
	it('returns a public path and no task for cached icons', () => {
		const plan = planIconDownloads([toIconSource('pyro', 'https://example.com/pyro.png')], {
			...baseOptions,
			isIconDownloaded: (filename) => filename === 'pyro.png'
		});
		expect(plan[0].publicPath).toBe('/icons/bosses/pyro.png');
		expect(plan[0].task).toBeUndefined();
	});

	it('uses the first cached candidate', () => {
		const [source] = toBossIconSources([baseBoss], new Map([[1, 'yatta_andrius']]));
		const plan = planIconDownloads([source], {
			...baseOptions,
			isIconDownloaded: (filename) => filename === 'andrius.png'
		});
		expect(plan[0].publicPath).toBe('/icons/bosses/andrius.png');
		expect(plan[0].task).toBeUndefined();
	});

	it('creates a task from the first candidate when nothing is cached', () => {
		const [source] = toBossIconSources([baseBoss], new Map([[1, 'yatta_andrius']]));
		const plan = planIconDownloads([source], baseOptions);
		expect(plan[0].task).toEqual({
			url: 'https://gi.yatta.moe/assets/UI/monster/yatta_andrius.png',
			dir: '/tmp/icons/bosses',
			filename: 'yatta_andrius.png'
		});
		expect(plan[0].publicPath).toBe('/icons/bosses/yatta_andrius.png');
	});

	it('plans a download even for cached icons when force is set', () => {
		const plan = planIconDownloads([toIconSource('pyro', 'https://example.com/pyro.png')], {
			...baseOptions,
			isIconDownloaded: () => true,
			force: true
		});
		expect(plan[0].task).toBeDefined();
	});

	it('throws when a source has no resolvable icon', () => {
		expect(() => planIconDownloads([toIconSource('pyro', undefined)], baseOptions)).toThrow(
			'Unable to resolve icon for pyro'
		);
	});

	it('keeps the source attached to the plan entry', () => {
		const [source] = toBossIconSources([baseBoss], new Map());
		const plan = planIconDownloads([source], baseOptions);
		expect(plan[0].source.boss.name).toBe('Andrius');
	});
});

describe('plannedTasks', () => {
	it('collects only the planned download tasks', () => {
		const plan = planIconDownloads(
			[
				toIconSource('pyro', 'https://example.com/pyro.png'),
				toIconSource('hydro', 'https://example.com/hydro.png')
			],
			{ ...baseOptions, isIconDownloaded: (filename) => filename === 'pyro.png' }
		);
		expect(plannedTasks(plan)).toEqual([
			{ url: 'https://example.com/hydro.png', dir: '/tmp/icons/bosses', filename: 'hydro.png' }
		]);
	});
});

import { describe, expect, it } from 'vitest';
import { planBossIconDownloads, planIconDownloads } from './icon-plan.js';

const baseBoss = {
	id: 1,
	name: 'Andrius',
	description: '',
	categoryType: 'CODEX_SUBTYPE_BOSS',
	enemyType: 'BOSS',
	images: { filename_icon: 'andrius' }
};

describe('planBossIconDownloads', () => {
	it('skips existing icons and returns no tasks', () => {
		const yatta = new Map<number, string>([[1, 'yatta_andrius']]);
		const plan = planBossIconDownloads([baseBoss], {
			iconsDir: '/tmp/icons/bosses',
			publicPath: '/icons/bosses',
			yattaIconById: yatta,
			isIconDownloaded: (filename) => filename === 'yatta_andrius.png'
		});
		expect(plan.tasks).toHaveLength(0);
		expect(plan.iconByName.get('Andrius')).toBe('/icons/bosses/yatta_andrius.png');
	});

	it('prefers the Yatta filename when the file exists', () => {
		const yatta = new Map<number, string>([[1, 'yatta_andrius']]);
		const plan = planBossIconDownloads([baseBoss], {
			iconsDir: '/tmp/icons/bosses',
			publicPath: '/icons/bosses',
			yattaIconById: yatta,
			isIconDownloaded: (filename) => filename === 'yatta_andrius.png'
		});
		expect(plan.iconByName.get('Andrius')).toBe('/icons/bosses/yatta_andrius.png');
	});

	it('falls back to genshin-db filename when Yatta is unavailable', () => {
		const plan = planBossIconDownloads([baseBoss], {
			iconsDir: '/tmp/icons/bosses',
			publicPath: '/icons/bosses',
			yattaIconById: undefined,
			isIconDownloaded: () => false
		});
		expect(plan.tasks).toHaveLength(1);
		expect(plan.tasks[0].url).toBe('https://gi.yatta.moe/assets/UI/monster/andrius.png');
		expect(plan.iconByName.get('Andrius')).toBe('/icons/bosses/andrius.png');
	});

	it('throws when a boss has no resolvable icon', () => {
		const boss = { ...baseBoss, images: {} };
		expect(() =>
			planBossIconDownloads([boss], {
				iconsDir: '/tmp/icons/bosses',
				publicPath: '/icons/bosses',
				yattaIconById: undefined,
				isIconDownloaded: () => false
			})
		).toThrow('Unable to resolve icon for Andrius');
	});
});

describe('planIconDownloads', () => {
	it('skips existing icons', () => {
		const plan = planIconDownloads([{ key: 'pyro', remoteUrl: 'https://example.com/pyro.png' }], {
			iconsDir: '/tmp/icons/elements',
			publicPath: '/icons/elements',
			isIconDownloaded: (filename) => filename === 'pyro.png'
		});
		expect(plan.tasks).toHaveLength(0);
		expect(plan.publicPathByKey.get('pyro')).toBe('/icons/elements/pyro.png');
	});

	it('creates a task for missing icons', () => {
		const plan = planIconDownloads([{ key: 'pyro', remoteUrl: 'https://example.com/pyro.png' }], {
			iconsDir: '/tmp/icons/elements',
			publicPath: '/icons/elements',
			isIconDownloaded: () => false
		});
		expect(plan.tasks).toHaveLength(1);
		expect(plan.tasks[0].url).toBe('https://example.com/pyro.png');
		expect(plan.tasks[0].filename).toBe('pyro.png');
	});

	it('throws when remoteUrl is missing and icon is not downloaded', () => {
		expect(() =>
			planIconDownloads([{ key: 'pyro', remoteUrl: undefined }], {
				iconsDir: '/tmp/icons/elements',
				publicPath: '/icons/elements',
				isIconDownloaded: () => false
			})
		).toThrow('No remote URL for icon: pyro');
	});
});

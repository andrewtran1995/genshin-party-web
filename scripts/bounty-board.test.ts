/**
 * Validates the bounty board under `docs/bounty-board/`.
 *
 * Unattended runs edit these files as their final step (see the board's
 * README), so the board's own state is the thing most likely to be corrupted
 * by an agent in a hurry. This test runs in the node project on every
 * `pnpm test:unit`, which the pre-commit hook gates on, so a malformed bounty
 * cannot be committed in the first place.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const boardDir = join(repoRoot, 'docs/bounty-board');
const bountiesDir = join(boardDir, 'bounties');

const REQUIRED_HEADINGS = [
	'## Why this matters',
	'## Scope',
	'## Exit criteria',
	'## Guardrails',
	'## Findings log'
];

const STATUSES = ['open', 'in-progress', 'done', 'retired'];
const SIZES = ['S', 'M', 'L'];

/** Reads the flat `key: value` frontmatter block a bounty file opens with. */
function parseFrontmatter(source: string): Record<string, string> {
	const match = /^---\n([\s\S]*?)\n---\n/.exec(source);
	if (!match) return {};
	return Object.fromEntries(
		match[1]
			.split('\n')
			.filter((line) => line.trim() !== '')
			.map((line) => {
				const separator = line.indexOf(':');
				return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
			})
	);
}

const filenames = readdirSync(bountiesDir).sort();
const bounties = filenames.map((filename) => ({
	filename,
	frontmatter: parseFrontmatter(readFileSync(join(bountiesDir, filename), 'utf-8')),
	body: readFileSync(join(bountiesDir, filename), 'utf-8')
}));

describe('bounty board', () => {
	it('holds at least one bounty', () => {
		expect(filenames.length).toBeGreaterThan(0);
	});

	it('holds only markdown files', () => {
		expect(filenames.filter((name) => !name.endsWith('.md'))).toEqual([]);
	});

	it('gives every bounty a unique id', () => {
		const ids = bounties.map((bounty) => bounty.frontmatter.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('keeps the template in step with the headings required below', () => {
		const template = readFileSync(join(boardDir, 'TEMPLATE.md'), 'utf-8');
		expect(REQUIRED_HEADINGS.filter((heading) => !template.includes(heading))).toEqual([]);
	});
});

describe.each(bounties)('$filename', ({ filename, frontmatter, body }) => {
	it('is named after its id', () => {
		expect(filename).toMatch(new RegExp(`^${frontmatter.id}-[a-z0-9-]+\\.md$`));
	});

	it('has a three-digit id', () => {
		expect(frontmatter.id).toMatch(/^\d{3}$/);
	});

	it('has a title', () => {
		expect(frontmatter.title ?? '').not.toBe('');
	});

	it('has a known status', () => {
		expect(STATUSES).toContain(frontmatter.status);
	});

	it('has a known size', () => {
		expect(SIZES).toContain(frontmatter.size);
	});

	it('records when it last ran', () => {
		expect(frontmatter['last-run']).toMatch(/^(never|\d{4}-\d{2}-\d{2})$/);
	});

	it('counts its runs', () => {
		expect(frontmatter.runs).toMatch(/^\d+$/);
	});

	it('carries every required section', () => {
		expect(REQUIRED_HEADINGS.filter((heading) => !body.includes(heading))).toEqual([]);
	});
});

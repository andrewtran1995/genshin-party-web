/**
 * Verifies that the vendored skills under `.agents/skills/` match
 * `skills-lock.json`. Skills are vendored (committed) rather than restored
 * from the network at install time, so this is the guardrail that catches a
 * `skills-lock.json` edited without re-vendoring the corresponding folder,
 * or a vendored folder edited/removed without updating the lockfile.
 *
 * Mirrors the folder-hashing algorithm the `skills` CLI (skills.sh) uses to
 * produce `computedHash`: sha256 over each file's relative path + content,
 * for every file in the skill directory, sorted by relative path.
 */
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const lockPath = join(repoRoot, 'skills-lock.json');
const skillsDir = join(repoRoot, '.agents/skills');

interface SkillsLock {
	version: number;
	skills: Record<string, { computedHash: string }>;
}

async function collectFiles(
	baseDir: string,
	currentDir: string,
	results: { relativePath: string; content: Buffer }[]
) {
	const entries = await readdir(currentDir, { withFileTypes: true });
	await Promise.all(
		entries.map(async (entry) => {
			const fullPath = join(currentDir, entry.name);
			if (entry.isDirectory()) {
				if (entry.name === '.git' || entry.name === 'node_modules') return;
				await collectFiles(baseDir, fullPath, results);
			} else if (entry.isFile()) {
				const content = await readFile(fullPath);
				const relativePath = relative(baseDir, fullPath).split(sep).join('/');
				results.push({ relativePath, content });
			}
		})
	);
}

async function computeSkillFolderHash(skillDir: string): Promise<string> {
	const files: { relativePath: string; content: Buffer }[] = [];
	await collectFiles(skillDir, skillDir, files);
	files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
	const hash = createHash('sha256');
	for (const file of files) {
		hash.update(file.relativePath);
		hash.update(file.content);
	}
	return hash.digest('hex');
}

const lock: SkillsLock = JSON.parse(await readFile(lockPath, 'utf-8'));
const problems: string[] = [];

for (const [name, entry] of Object.entries(lock.skills)) {
	const skillDir = join(skillsDir, name);
	if (!existsSync(skillDir)) {
		problems.push(
			`- "${name}" is listed in skills-lock.json but .agents/skills/${name} is missing.`
		);
		continue;
	}
	const actualHash = await computeSkillFolderHash(skillDir);
	if (actualHash !== entry.computedHash) {
		problems.push(
			`- "${name}" is out of date: .agents/skills/${name} hashes to ${actualHash}, but skills-lock.json expects ${entry.computedHash}.`
		);
	}
}

if (existsSync(skillsDir)) {
	const vendoredNames = await readdir(skillsDir, { withFileTypes: true });
	for (const entry of vendoredNames) {
		if (entry.isDirectory() && !(entry.name in lock.skills)) {
			problems.push(
				`- .agents/skills/${entry.name} is vendored but has no entry in skills-lock.json.`
			);
		}
	}
}

if (problems.length > 0) {
	console.error('Vendored skills are out of sync with skills-lock.json:\n');
	console.error(problems.join('\n'));
	console.error(
		'\nRun `pnpm skills:install && pnpm skills:sync` to restore skills, then commit the ' +
			'refreshed `.agents/skills/` (and `skills-lock.json`, if it changed).'
	);
	process.exit(1);
}

console.log(`Vendored skills match skills-lock.json (${Object.keys(lock.skills).length} skills).`);

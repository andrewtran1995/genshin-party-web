import prettier from 'eslint-config-prettier';
import path from 'node:path';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	{ ignores: ['.agents/', '.claude/', '.opencode/', '.cursor/', '.kiro/', '.codex/', '.gemini/'] },
	js.configs.recommended,
	...ts.configs.strictTypeChecked,
	...ts.configs.stylisticTypeChecked,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname
			}
		},
		rules: {
			'no-undef': 'off',
			'@typescript-eslint/dot-notation': 'off',
			'@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
			'no-restricted-syntax': [
				'error',
				{
					selector: "ExportNamedDeclaration > FunctionDeclaration[id.name='load']",
					message:
						"Type the load function: `export const load: PageLoad = …` (or LayoutLoad/PageServerLoad) from './$types', not an untyped `export function load`."
				}
			],
			'svelte/button-has-type': 'error',
			'svelte/no-target-blank': 'error'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	},
	{
		files: ['**/*.svelte'],
		rules: {
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			'@typescript-eslint/no-unnecessary-condition': 'off'
		}
	},
	{
		files: ['*.config.{js,ts}', 'e2e/**', 'scripts/**'],
		extends: [ts.configs.disableTypeChecked]
	}
);

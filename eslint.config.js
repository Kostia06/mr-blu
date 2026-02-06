// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';

export default ts.config(
    js.configs.recommended,
    ...ts.configs.recommended,
    ...svelte.configs['flat/recommended'],
    {
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
    {
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		}
	},
    {
		rules: {
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/no-explicit-any': 'warn',
			'no-console': ['warn', { allow: ['error', 'warn'] }],
			'svelte/no-navigation-without-resolve': 'warn',
			'svelte/require-each-key': 'warn',
			'svelte/no-at-html-tags': 'warn',
			'svelte/no-unused-svelte-ignore': 'warn',
			'svelte/no-useless-children-snippet': 'warn',
			'svelte/prefer-svelte-reactivity': 'warn',
			'no-case-declarations': 'warn'
		}
	},
    {
		ignores: ['.svelte-kit/', 'build/', 'node_modules/', '.cloudflare/', '.wrangler/', 'ios/', 'android/', 'storybook-static/', '**/*.svelte.ts']
	},
    storybook.configs["flat/recommended"]
);

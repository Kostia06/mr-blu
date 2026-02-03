import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		// Exclude component tests that require full Svelte 5 browser mounting
		exclude: ['src/lib/components/**/*.test.ts'],
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/tests/setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules',
				'src/tests',
				'.svelte-kit',
				'**/*.config.{js,ts}',
				'**/*.d.ts'
			],
			include: ['src/lib/**/*.ts', 'src/lib/**/*.svelte']
		},
		alias: {
			$lib: '/src/lib',
			$app: '/node_modules/@sveltejs/kit/src/runtime/app'
		}
	}
});

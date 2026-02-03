import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';

const isCapacitor = process.env.BUILD_TARGET === 'capacitor';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		...(isCapacitor
			? []
			: [
					{
						name: 'create-prerendered-dir',
						closeBundle() {
							mkdirSync('.svelte-kit/output/prerendered', { recursive: true });
							writeFileSync('.svelte-kit/output/prerendered/fallback.html', '');
						}
					}
				])
	]
});

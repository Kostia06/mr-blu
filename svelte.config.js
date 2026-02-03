import cloudflare from '@sveltejs/adapter-cloudflare';
import static_ from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const isCapacitor = process.env.BUILD_TARGET === 'capacitor';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: isCapacitor
			? static_({ fallback: 'index.html' })
			: cloudflare({
					routes: {
						include: ['/*'],
						exclude: ['<all>']
					}
				}),
		alias: {
			$components: 'src/lib/components',
			$stores: 'src/lib/stores',
			$utils: 'src/lib/utils'
		}
	}
};

export default config;

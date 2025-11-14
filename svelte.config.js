import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// SPA mode configuration - required for adapter-static
		adapter: adapter({
			fallback: 'index.html' // Required for SPA routing
		})
	}
};

export default config;

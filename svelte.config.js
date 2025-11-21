import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	// Suppress export-let-unused warnings for props intentionally exported for parent use
	onwarn: (warning, handler) => {
		// Suppress export-let-unused warnings (props used by parent components)
		if (warning.code === 'export-let-unused') return;
		handler(warning);
	},

	compilerOptions: {
		// Svelte 5 compiler options
	},

	kit: {
		// SPA mode configuration - required for adapter-static
		adapter: adapter({
			fallback: 'index.html' // Required for SPA routing
		})
	}
};

export default config;

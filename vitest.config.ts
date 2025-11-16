import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'node',
		globals: true,
		// Speed optimizations
		pool: 'threads', // Parallel execution (default)
		poolOptions: {
			threads: {
				singleThread: false // Use all cores
			}
		},
		// Fast test isolation
		isolate: true,
		// Coverage enabled by default (adds ~126ms overhead, ~25% slower)
		coverage: {
			enabled: true,
			provider: 'v8',
			reporter: ['text-summary'],
			exclude: [
				'node_modules/',
				'src/**/*.test.ts',
				'src/**/*.spec.ts',
				'src/**/__tests__/**',
				'**/*.d.ts',
				'**/*.config.*',
				'**/dist/**',
				'**/.svelte-kit/**'
			],
			// Report coverage but don't fail on thresholds (for now)
			thresholds: {
				lines: 0,
				functions: 0,
				branches: 0,
				statements: 0
			}
		}
	}
});


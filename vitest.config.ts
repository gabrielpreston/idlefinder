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
			reporter: ['text-summary', 'html'],
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
			// 70% coverage threshold for all categories
			thresholds: {
				lines: 70,
				functions: 70,
				branches: 70,
				statements: 70
			}
		}
	}
});


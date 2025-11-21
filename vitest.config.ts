import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'node', // Default for domain tests
		globals: true,
		// Speed optimizations
		pool: 'threads', // Parallel execution (default)
		poolOptions: {
			threads: {
				maxThreads: 4,
				minThreads: 1
			}
		},
		// Fast test isolation
		isolate: true,
		// Test timeouts
		testTimeout: 5000,
		hookTimeout: 10000,
		// Coverage disabled by default (adds ~126ms overhead, ~25% slower)
		// Enable with --coverage flag: npm test -- --coverage
		coverage: {
			enabled: false,
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
	},
	// Add environment-specific configs
	testEnvironmentOptions: {
		jsdom: {
			// jsdom-specific options if needed
		}
	}
});


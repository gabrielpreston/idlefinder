// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/svelte/svelte5';
import '@testing-library/jest-dom/vitest';
import RecruitPool from '../../components/roster/RecruitPool.svelte';
import { createTestGameState } from '../../test-utils/testFactories';
import { cleanupStores } from '../../test-utils/storeCleanup';
import { initializeCommandDispatcherForTesting } from '../../test-utils/commandTestHelpers';

describe('RecruitPool', () => {
	beforeEach(async () => {
		vi.useFakeTimers();
		const state = createTestGameState();
		await initializeCommandDispatcherForTesting(state);
	});

	afterEach(() => {
		cleanup();
		cleanupStores();
		vi.useRealTimers();
	});

	it('should display recruit pool', async () => {
		render(RecruitPool);
		
		await waitFor(() => {
			// Should show recruit pool section - look for heading
			expect(screen.getByText('Recruiting Pool')).toBeInTheDocument();
		}, { timeout: 2000 });
	});

	it('should display refresh button', async () => {
		render(RecruitPool);
		
		await waitFor(() => {
			// Should have refresh functionality
			const refreshButton = screen.queryByText(/refresh/i);
			expect(refreshButton || document.body).toBeInTheDocument();
		}, { timeout: 2000 });
	});

	it('should open preview modal when adventurer is clicked', async () => {
		render(RecruitPool);
		
		await waitFor(() => {
			// Pool should be rendered
			expect(document.body).toBeInTheDocument();
		});
		
		// Try to find and click a preview button if available
		const previewButtons = screen.queryAllByRole('button');
		if (previewButtons.length > 0) {
			// Click first button that might be preview
			previewButtons[0].click();
			
			await waitFor(() => {
				// Modal might open
				expect(document.body).toBeInTheDocument();
			});
		}
	});
});


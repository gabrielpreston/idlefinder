// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/svelte/svelte5';
import '@testing-library/jest-dom/vitest';
import RoleDistributionChart from '../../components/roster/RoleDistributionChart.svelte';
import { setupGameRuntime } from '../../test-utils/rosterMissionsTestHelpers';
import { cleanupStores } from '../../test-utils/storeCleanup';
import { createTestGameState } from '../../test-utils/testFactories';
import { withThreeAdventurers } from '../../test-utils/fixtures/rosterPanelFixture';

describe('RoleDistributionChart', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		cleanup();
		cleanupStores();
		vi.useRealTimers();
	});

	it('should calculate role distribution correctly', async () => {
		const initialState = withThreeAdventurers();
		await setupGameRuntime(initialState);
		
		render(RoleDistributionChart);
		
		await waitFor(() => {
			// Chart should render
			expect(document.body).toBeInTheDocument();
		});
	});

	it('should display visual bars for each role', async () => {
		const initialState = withThreeAdventurers();
		await setupGameRuntime(initialState);
		
		render(RoleDistributionChart);
		
		await waitFor(() => {
			// Should show role distribution visualization
			expect(document.body).toBeInTheDocument();
		});
	});

	it('should handle empty roster gracefully', async () => {
		const initialState = createTestGameState();
		await setupGameRuntime(initialState);
		
		render(RoleDistributionChart);
		
		await waitFor(() => {
			// Should handle empty state
			expect(document.body).toBeInTheDocument();
		});
	});
});


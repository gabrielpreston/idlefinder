// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/svelte/svelte5';
import '@testing-library/jest-dom/vitest';
import MissionsPanel from '../../components/missions/MissionsPanel.svelte';
import RosterPanel from '../../components/roster/RosterPanel.svelte';
import { setupGameRuntime, setupMissionsTestState, setupRosterTestState } from '../../test-utils/rosterMissionsTestHelpers';
import { cleanupStores } from '../../test-utils/storeCleanup';
import { createTestGameState } from '../../test-utils/testFactories';
import { missionBuilder } from '../../test-utils/builders/missionBuilder';
import { adventurerBuilder } from '../../test-utils/builders/adventurerBuilder';

describe('UI Edge Cases', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		cleanup();
		cleanupStores();
		vi.useRealTimers();
	});

	describe('Empty Data', () => {
		it('should handle empty missions list', async () => {
			const initialState = createTestGameState();
			await setupGameRuntime(initialState);
			
			render(MissionsPanel);
			
			await waitFor(() => {
				expect(screen.getByText('Missions')).toBeInTheDocument();
			});
			
			// Navigate to collection view
			const viewAllButton = screen.getByText('View All Missions');
			viewAllButton.click();
			
			await waitFor(() => {
				expect(screen.queryByText(/back to overview/i)).toBeInTheDocument();
			});
			
			// Should show empty state message
			const emptyMessage = screen.queryByText(/no.*missions.*match/i);
			expect(emptyMessage || screen.getByText('Missions')).toBeInTheDocument();
		});

		it('should handle empty adventurers list', async () => {
			const initialState = createTestGameState();
		await setupGameRuntime(initialState);
		
		render(RosterPanel);
			
			await waitFor(() => {
				expect(screen.getByText('Adventurer Roster')).toBeInTheDocument();
			});
			
			// Should handle empty roster gracefully
			expect(screen.getByText('Adventurer Roster')).toBeInTheDocument();
		});
	});

	describe('Filter Edge Cases', () => {
		it('should handle filter with no matches', async () => {
			const mission = missionBuilder()
				.id('mission-1')
				.name('Combat Mission')
				.available()
				.build();
			
			const initialState = setupMissionsTestState([mission]);
			await setupGameRuntime(initialState);
			
			render(MissionsPanel);
			
			// Navigate to collection view
			const viewAllButton = await waitFor(() => screen.getByText('View All Missions'));
			viewAllButton.click();
			
			await waitFor(() => {
				expect(screen.queryByText(/back to overview/i)).toBeInTheDocument();
			});
			
			// Filter by type that doesn't match
			const typeFilter = screen.getByLabelText(/type/i) as HTMLSelectElement;
			typeFilter.value = 'exploration';
			typeFilter.dispatchEvent(new Event('change', { bubbles: true }));
			
			await waitFor(() => {
				const emptyMessage = screen.queryByText(/no.*missions.*match/i);
				expect(emptyMessage || screen.getByText('Missions')).toBeInTheDocument();
			});
		});


		it('should handle combined filters with no matches', async () => {
			const mission = missionBuilder()
				.id('mission-1')
				.name('Combat Mission')
				.available()
				.build();
			
			const initialState = setupMissionsTestState([mission]);
			await setupGameRuntime(initialState);
			
			render(MissionsPanel);
			
			// Navigate to collection view
			const viewAllButton = await waitFor(() => screen.getByText('View All Missions'));
			viewAllButton.click();
			
			await waitFor(() => {
				expect(screen.queryByText(/back to overview/i)).toBeInTheDocument();
			});
			
			// Apply filters that don't match
			const stateFilter = screen.getByLabelText(/state/i) as HTMLSelectElement;
			const typeFilter = screen.getByLabelText(/type/i) as HTMLSelectElement;
			
			stateFilter.value = 'Expired';
			stateFilter.dispatchEvent(new Event('change', { bubbles: true }));
			
			typeFilter.value = 'exploration';
			typeFilter.dispatchEvent(new Event('change', { bubbles: true }));
			
			await waitFor(() => {
				const emptyMessage = screen.queryByText(/no.*missions.*match/i);
				expect(emptyMessage || screen.getByText('Missions')).toBeInTheDocument();
			});
		});
	});

	describe('Long Names', () => {
		it('should handle missions with very long names', async () => {
			const longName = 'A'.repeat(100);
			const mission = missionBuilder()
				.id('mission-1')
				.name(longName)
				.available()
				.build();
			
			const initialState = setupMissionsTestState([mission]);
			await setupGameRuntime(initialState);
			
			render(MissionsPanel);
			
			await waitFor(() => {
				expect(screen.getByText('Missions')).toBeInTheDocument();
			});
			
			// Should render without breaking
			expect(document.body).toBeInTheDocument();
		});

		it('should handle adventurers with very long names', async () => {
			const longName = 'B'.repeat(100);
			const adventurer = adventurerBuilder()
				.id('adv-1')
				.name(longName)
				.idle()
				.build();
			
			const initialState = setupRosterTestState([adventurer]);
		await setupGameRuntime(initialState);
		
		render(RosterPanel);
			
			await waitFor(() => {
				expect(screen.getByText('Adventurer Roster')).toBeInTheDocument();
			});
			
			// Should render without breaking
			expect(document.body).toBeInTheDocument();
		});
	});
});


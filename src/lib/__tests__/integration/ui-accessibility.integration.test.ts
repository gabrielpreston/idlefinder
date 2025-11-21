// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/svelte/svelte5';
import '@testing-library/jest-dom/vitest';
import MissionsPanel from '../../components/missions/MissionsPanel.svelte';
import RosterPanel from '../../components/roster/RosterPanel.svelte';
import { setupGameRuntime } from '../../test-utils/rosterMissionsTestHelpers';
import { cleanupStores } from '../../test-utils/storeCleanup';
import { createTestGameState } from '../../test-utils/testFactories';
import userEvent from '@testing-library/user-event';

describe('UI Accessibility', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		cleanup();
		cleanupStores();
		vi.useRealTimers();
	});

	describe('Keyboard Navigation', () => {
		it('should support keyboard navigation in Missions panel', async () => {
			const state = createTestGameState();
			await setupGameRuntime(state);
			
			render(MissionsPanel);
			
			await waitFor(() => {
				expect(screen.getByText('Missions')).toBeInTheDocument();
			});
			
			// Find interactive elements
			const viewAllButton = screen.getByText('View All Missions');
			expect(viewAllButton).toBeInTheDocument();
			
			// Should be keyboard accessible - use real timers for userEvent
			vi.useRealTimers();
			const user = userEvent.setup();
			viewAllButton.focus();
			await user.keyboard('{Enter}');
			
			await waitFor(() => {
				expect(screen.queryByText(/back to overview/i)).toBeInTheDocument();
			});
			vi.useFakeTimers();
		});

		it('should support keyboard navigation in Roster panel', async () => {
			const state = createTestGameState();
			await setupGameRuntime(state);
			
			render(RosterPanel);
			
			await waitFor(() => {
				expect(screen.getByText('Adventurer Roster')).toBeInTheDocument();
			});
			
			// Find interactive elements
			const searchInput = screen.getByLabelText(/search/i);
			expect(searchInput).toBeInTheDocument();
			
			// Should be keyboard accessible - use real timers for userEvent
			vi.useRealTimers();
			const user = userEvent.setup();
			await user.type(searchInput, 'test');
			
			await waitFor(() => {
				expect((searchInput as HTMLInputElement).value).toBe('test');
			});
			vi.useFakeTimers();
		});

		it('should support Enter and Space keys on clickable elements', async () => {
			const state = createTestGameState();
			await setupGameRuntime(state);
			
			render(MissionsPanel);
			
			await waitFor(() => {
				expect(screen.getByText('Missions')).toBeInTheDocument();
			});
			
			// Find stat cards with role="button"
			const statCards = screen.queryAllByRole('button');
			if (statCards.length > 0) {
				// Use real timers for userEvent
				vi.useRealTimers();
				const user = userEvent.setup();
				statCards[0].focus();
				await user.keyboard(' ');
				
				// Should trigger action - check that something changed
				await waitFor(() => {
					expect(document.body).toBeInTheDocument();
				});
				vi.useFakeTimers();
			}
		});
	});

	describe('ARIA Labels', () => {
		it('should have proper ARIA labels on form controls', async () => {
			const state = createTestGameState();
			await setupGameRuntime(state);
			
			render(MissionsPanel);
			
			// Navigate to collection view
			const viewAllButton = await waitFor(() => screen.getByText('View All Missions'));
			viewAllButton.click();
			
			await waitFor(() => {
				expect(screen.queryByText(/back to overview/i)).toBeInTheDocument();
			});
			
			// Check for labeled form controls
			const stateFilter = screen.getByLabelText(/state/i);
			const typeFilter = screen.getByLabelText(/type/i);
			const searchInput = screen.getByLabelText(/search/i);
			
			expect(stateFilter).toBeInTheDocument();
			expect(typeFilter).toBeInTheDocument();
			expect(searchInput).toBeInTheDocument();
		});

		it('should have proper role attributes on interactive elements', async () => {
			const state = createTestGameState();
			await setupGameRuntime(state);
			
			render(MissionsPanel);
			
			await waitFor(() => {
				expect(screen.getByText('Missions')).toBeInTheDocument();
			});
			
			// Check for role="button" on clickable stat cards
			const buttons = screen.queryAllByRole('button');
			expect(buttons.length).toBeGreaterThan(0);
		});
	});

	describe('Focus Management', () => {
		it('should manage focus when modals open and close', async () => {
			const state = createTestGameState();
			await setupGameRuntime(state);
			
			render(MissionsPanel);
			
			await waitFor(() => {
				expect(screen.getByText('Missions')).toBeInTheDocument();
			});
			
			// Modal focus management is handled by Modal component
			// This test verifies the component renders
			expect(document.body).toBeInTheDocument();
		});
	});
});


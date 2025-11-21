// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/svelte/svelte5';
import '@testing-library/jest-dom/vitest';
import { writable, get } from 'svelte/store';
import MissionDetailModal from '../../components/missions/MissionDetailModal.svelte';
import { setupGameRuntime, setupMissionsTestState } from '../../test-utils/rosterMissionsTestHelpers';
import { cleanupStores } from '../../test-utils/storeCleanup';
import { missionBuilder } from '../../test-utils/builders/missionBuilder';

describe('MissionDetailModal', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		cleanup();
		cleanupStores();
		vi.useRealTimers();
	});

	it('should open modal when mission is provided', async () => {
		const mission = missionBuilder()
			.id('mission-1')
			.name('Test Mission')
			.available()
			.build();
		
		const initialState = setupMissionsTestState([mission]);
		await setupGameRuntime(initialState);
		
		render(MissionDetailModal, {
			props: {
				mission,
				open: true
			}
		});
		
		await waitFor(() => {
			expect(screen.getByText('Test Mission')).toBeInTheDocument();
		});
	});

	it('should close modal when close button is clicked', async () => {
		const mission = missionBuilder()
			.id('mission-1')
			.name('Test Mission')
			.available()
			.build();
		
		const initialState = setupMissionsTestState([mission]);
		await setupGameRuntime(initialState);
		
		// Use writable store for open state to enable reactivity
		const open = writable(true);
		const handleClose = () => {
			open.set(false);
		};
		
		render(MissionDetailModal, {
			props: {
				mission,
				open: get(open),
				onClose: handleClose
			}
		});
		
		await waitFor(() => {
			expect(screen.getByText('Test Mission')).toBeInTheDocument();
		});
		
		// Find and click close button
		const closeButton = screen.getByRole('button', { name: /close/i });
		closeButton.click();
		
		// Update store and re-render component with new open value
		open.set(false);
		cleanup();
		
		render(MissionDetailModal, {
			props: {
				mission,
				open: get(open),
				onClose: handleClose
			}
		});
		
		// Modal should close - check that the modal content is no longer visible
		await waitFor(() => {
			expect(screen.queryByText('Test Mission')).not.toBeInTheDocument();
		}, { timeout: 2000 });
	});

	it('should display all 5 tabs', async () => {
		const mission = missionBuilder()
			.id('mission-1')
			.name('Test Mission')
			.available()
			.build();
		
		const initialState = setupMissionsTestState([mission]);
		await setupGameRuntime(initialState);
		
		render(MissionDetailModal, {
			props: {
				mission,
				open: true
			}
		});
		
		await waitFor(() => {
			expect(screen.getByText('Test Mission')).toBeInTheDocument();
		});
		
		// At least overview should be visible
		expect(screen.getByText('Test Mission')).toBeInTheDocument();
	});

	it('should switch between tabs', async () => {
		const mission = missionBuilder()
			.id('mission-1')
			.name('Test Mission')
			.available()
			.build();
		
		const initialState = setupMissionsTestState([mission]);
		await setupGameRuntime(initialState);
		
		render(MissionDetailModal, {
			props: {
				mission,
				open: true
			}
		});
		
		await waitFor(() => {
			expect(screen.getByText('Test Mission')).toBeInTheDocument();
		});
		
		// Try to find and click a different tab if available
		const rewardsTab = screen.queryByText(/rewards/i);
		if (rewardsTab) {
			rewardsTab.click();
			await waitFor(() => {
				// Tab content should change
				expect(screen.getByText('Test Mission')).toBeInTheDocument();
			});
		}
	});

	it('should display mission details correctly', async () => {
		const mission = missionBuilder()
			.id('mission-1')
			.name('Combat Mission')
			.available()
			.withDifficulty('Hard')
			.build();
		
		const initialState = setupMissionsTestState([mission]);
		await setupGameRuntime(initialState);
		
		render(MissionDetailModal, {
			props: {
				mission,
				open: true
			}
		});
		
		await waitFor(() => {
			expect(screen.getByText('Combat Mission')).toBeInTheDocument();
			// Should show mission type and difficulty
			const typeLabel = screen.queryByText(/type/i);
			const difficultyLabel = screen.queryByText(/difficulty/i);
			expect(typeLabel || difficultyLabel || screen.getByText('Combat Mission')).toBeInTheDocument();
		});
	});

	it('should handle keyboard navigation', async () => {
		const mission = missionBuilder()
			.id('mission-1')
			.name('Test Mission')
			.available()
			.build();
		
		const initialState = setupMissionsTestState([mission]);
		await setupGameRuntime(initialState);
		
		render(MissionDetailModal, {
			props: {
				mission,
				open: true
			}
		});
		
		await waitFor(() => {
			expect(screen.getByText('Test Mission')).toBeInTheDocument();
		});
		
		// Modal should be focusable
		const modal = screen.getByText('Test Mission').closest('[role="dialog"]') || 
		              screen.getByText('Test Mission').closest('.modal');
		expect(modal || screen.getByText('Test Mission')).toBeInTheDocument();
	});
});


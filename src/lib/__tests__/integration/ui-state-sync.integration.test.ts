// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/svelte/svelte5';
import '@testing-library/jest-dom/vitest';
import MissionsPanel from '../../components/missions/MissionsPanel.svelte';
import RosterPanel from '../../components/roster/RosterPanel.svelte';
import { setupGameRuntime, setupMissionsTestState, setupRosterTestState } from '../../test-utils/rosterMissionsTestHelpers';
import { cleanupStores } from '../../test-utils/storeCleanup';
import { createTestGameState, createTestMission, createTestAdventurer } from '../../test-utils/testFactories';
import { get } from 'svelte/store';
import { missions, adventurers } from '../../stores/gameState';

describe('UI State Synchronization', () => {
	beforeEach(async () => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		cleanup();
		cleanupStores();
		vi.useRealTimers();
	});

	describe('Real-time UI Updates', () => {
		it('should update Missions panel when missions change', async () => {
			const initialState = createTestGameState();
			const runtime = await setupGameRuntime(initialState);
			
			render(MissionsPanel);
			
			await waitFor(() => {
				expect(screen.getByText('Missions')).toBeInTheDocument();
			});
			
			// Add a new mission via runtime
			const newMission = createTestMission({ id: 'mission-new', name: 'New Mission', state: 'Available' });
			const currentState = runtime.busManager.getState();
			currentState.entities.set(newMission.id, newMission);
			runtime.busManager.setState(currentState);
			runtime.refreshGameState();
			
			// UI should update
			await waitFor(() => {
				const missionsStore = get(missions);
				expect(missionsStore.some(m => m.id === 'mission-new')).toBe(true);
			}, { timeout: 2000 });
		});

		it('should update Roster panel when adventurers change', async () => {
			const initialState = createTestGameState();
			const runtime = await setupGameRuntime(initialState);
			
			render(RosterPanel);
			
			await waitFor(() => {
				expect(screen.getByText('Adventurer Roster')).toBeInTheDocument();
			});
			
			// Add a new adventurer via runtime
			const newAdventurer = createTestAdventurer({ id: 'adv-new', name: 'New Adventurer', state: 'Idle' });
			const currentState = runtime.busManager.getState();
			currentState.entities.set(newAdventurer.id, newAdventurer);
			runtime.busManager.setState(currentState);
			runtime.refreshGameState();
			
			// UI should update
			await waitFor(() => {
				const adventurersStore = get(adventurers);
				expect(adventurersStore.some(a => a.id === 'adv-new')).toBe(true);
			}, { timeout: 2000 });
		});
	});

	describe('Store Reactivity', () => {
		it('should react to mission state changes', async () => {
			const mission = createTestMission({ id: 'mission-1', name: 'Test Mission', state: 'Available' });
			const initialState = setupMissionsTestState([mission]);
			const runtime = await setupGameRuntime(initialState);
			
			render(MissionsPanel);
			
			await waitFor(() => {
				expect(screen.getByText('Missions')).toBeInTheDocument();
			});
			
			// Change mission state
			const currentState = runtime.busManager.getState();
			const updatedMission = currentState.entities.get('mission-1');
			if (updatedMission && updatedMission.type === 'Mission') {
				const mission = updatedMission as import('../../domain/entities/Mission').Mission;
				mission.state = 'InProgress';
				currentState.entities.set('mission-1', mission);
				runtime.busManager.setState(currentState);
				runtime.refreshGameState();
			}
			
			// Store should update
			await waitFor(() => {
				const missionsStore = get(missions);
				const foundMission = missionsStore.find(m => m.id === 'mission-1');
				expect(foundMission?.state).toBe('InProgress');
			}, { timeout: 2000 });
		});

		it('should react to adventurer state changes', async () => {
			const adventurer = createTestAdventurer({ id: 'adv-1', name: 'Test Adventurer', state: 'Idle' });
			const initialState = setupRosterTestState([adventurer]);
			const runtime = await setupGameRuntime(initialState);
		
		render(RosterPanel);
			
			await waitFor(() => {
				expect(screen.getByText('Adventurer Roster')).toBeInTheDocument();
			});
			
			// Change adventurer state
			const currentState = runtime.busManager.getState();
			const updatedAdventurer = currentState.entities.get('adv-1');
			if (updatedAdventurer && updatedAdventurer.type === 'Adventurer') {
				const adventurer = updatedAdventurer as import('../../domain/entities/Adventurer').Adventurer;
				adventurer.state = 'OnMission';
				currentState.entities.set('adv-1', adventurer);
				runtime.busManager.setState(currentState);
				runtime.refreshGameState();
			}
			
			// Store should update
			await waitFor(() => {
				const adventurersStore = get(adventurers);
				const foundAdventurer = adventurersStore.find(a => a.id === 'adv-1');
				expect(foundAdventurer?.state).toBe('OnMission');
			}, { timeout: 2000 });
		});
	});
});


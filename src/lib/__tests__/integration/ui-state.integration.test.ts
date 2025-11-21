// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/svelte/svelte5';
import '@testing-library/jest-dom/vitest';
import AdventurerGrid from '../../components/roster/AdventurerGrid.svelte';
import { createTestGameState, createTestAdventurer, createTestMission } from '../../test-utils/testFactories';
import { startGame } from '../../runtime/startGame';
import { SimulatedTimeSource } from '../../time/DomainTimeSource';
import { Timestamp } from '../../domain/valueObjects/Timestamp';
import { gameState } from '../../stores/gameState';
import { registerHandlers } from '../../handlers/index';
import { createTestCommand } from '../../test-utils';

describe('UI State Integration', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	
	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('should update UI when adventurer state changes from Idle to OnMission', async () => {
		const bob = createTestAdventurer({ id: 'adv-1', name: 'Bob', state: 'Idle' });
		const tim = createTestAdventurer({ id: 'adv-2', name: 'Tim', state: 'Idle' });
		const initialState = createTestGameState();
		initialState.entities.set(bob.id, bob);
		initialState.entities.set(tim.id, tim);
		
		const runtime = startGame(initialState, new SimulatedTimeSource(Timestamp.now()));
		registerHandlers(runtime.busManager);
		gameState.initialize(runtime);
		
		// Get adventurers from store for rendering
		const { get } = await import('svelte/store');
		const { adventurers } = await import('../../stores/gameState');
		const currentAdventurers = get(adventurers);
		
		// Render component
		render(AdventurerGrid, {
			adventurers: currentAdventurers,
			filters: { state: 'all', role: 'all', search: '' },
			sortBy: 'level'
		});
		
		// Wait for initial render
		await waitFor(() => {
			expect(screen.getByText('Bob')).toBeInTheDocument();
			expect(screen.getByText('Tim')).toBeInTheDocument();
		});
		
		// Start mission for Bob
		const mission = createTestMission({ id: 'mission-1', state: 'Available' });
		const currentState = runtime.busManager.getState();
		currentState.entities.set(mission.id, mission);
		
		await runtime.busManager.commandBus.dispatch(
			createTestCommand('StartMission', {
				missionId: mission.id,
				adventurerIds: [bob.id]
			})
		);
		
		// Wait for state update - the MissionStarted event should trigger store update
		await waitFor(() => {
			const updatedAdventurers = get(adventurers);
			const bobUpdated = updatedAdventurers.find(a => a.id === bob.id);
			expect(bobUpdated?.state).toBe('OnMission');
		}, { timeout: 2000 });
		
		// Cleanup previous render before re-rendering
		cleanup();
		
		// Re-render with updated adventurers
		const { get: getUpdated } = await import('svelte/store');
		const { adventurers: updatedAdventurersStore } = await import('../../stores/gameState');
		const finalAdventurers = getUpdated(updatedAdventurersStore);
		
		render(AdventurerGrid, {
			adventurers: finalAdventurers,
			filters: { state: 'all', role: 'all', search: '' },
			sortBy: 'level'
		});
		
		await waitFor(() => {
			expect(screen.getByText('On Mission')).toBeInTheDocument();
			expect(screen.getByText('Available')).toBeInTheDocument();
		});
	});

	it('should display multiple adventurers with different states', async () => {
		const bob = createTestAdventurer({ id: 'adv-1', name: 'Bob', state: 'OnMission' });
		const tim = createTestAdventurer({ id: 'adv-2', name: 'Tim', state: 'Idle' });
		const initialState = createTestGameState();
		initialState.entities.set(bob.id, bob);
		initialState.entities.set(tim.id, tim);
		
		const runtime = startGame(initialState, new SimulatedTimeSource(Timestamp.now()));
		gameState.initialize(runtime);
		
		// Get adventurers from store
		const { get } = await import('svelte/store');
		const { adventurers } = await import('../../stores/gameState');
		const currentAdventurers = get(adventurers);
		
		render(AdventurerGrid, {
			adventurers: currentAdventurers,
			filters: { state: 'all', role: 'all', search: '' },
			sortBy: 'level'
		});
		
		await waitFor(() => {
			expect(screen.getByText('Bob')).toBeInTheDocument();
			expect(screen.getByText('Tim')).toBeInTheDocument();
		});
		
		// Verify states are displayed correctly
		expect(screen.getByText('On Mission')).toBeInTheDocument();
		expect(screen.getByText('Available')).toBeInTheDocument();
	});
});


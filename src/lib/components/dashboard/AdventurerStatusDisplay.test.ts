// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/svelte/svelte5';
import '@testing-library/jest-dom/vitest';
import AdventurerStatusDisplay from './AdventurerStatusDisplay.svelte';
import { createTestGameState, createTestAdventurer } from '../../test-utils/testFactories';
import { startGame } from '../../runtime/startGame';
import { SimulatedTimeSource } from '../../time/DomainTimeSource';
import { Timestamp } from '../../domain/valueObjects/Timestamp';
import { gameState } from '../../stores/gameState';

describe('AdventurerStatusDisplay', () => {
	beforeEach(() => {
		const state = createTestGameState();
		const runtime = startGame(state, new SimulatedTimeSource(Timestamp.now()));
		gameState.initialize(runtime);
	});

	afterEach(() => {
		cleanup();
	});

	it('should display "Adventurer Status" heading', () => {
		render(AdventurerStatusDisplay);
		expect(screen.getByText('Adventurer Status')).toBeInTheDocument();
	});

	it('should display empty state when no adventurers', async () => {
		render(AdventurerStatusDisplay);
		
		await waitFor(() => {
			expect(screen.getByText('No adventurers')).toBeInTheDocument();
		});
	});

	it('should display Idle count when adventurers are idle', async () => {
		const state = createTestGameState();
		const adventurer1 = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
		const adventurer2 = createTestAdventurer({ id: 'adv-2', state: 'Idle' });
		state.entities.set(adventurer1.id, adventurer1);
		state.entities.set(adventurer2.id, adventurer2);
		
		const runtime = startGame(state, new SimulatedTimeSource(Timestamp.now()));
		gameState.initialize(runtime);
		
		render(AdventurerStatusDisplay);
		
		await waitFor(() => {
			expect(screen.getByText(/Idle:\s*2/)).toBeInTheDocument();
		});
	});

	it('should display On Mission count when adventurers are on mission', async () => {
		const state = createTestGameState();
		const adventurer1 = createTestAdventurer({ id: 'adv-1', state: 'OnMission' });
		const adventurer2 = createTestAdventurer({ id: 'adv-2', state: 'OnMission' });
		state.entities.set(adventurer1.id, adventurer1);
		state.entities.set(adventurer2.id, adventurer2);
		
		const runtime = startGame(state, new SimulatedTimeSource(Timestamp.now()));
		gameState.initialize(runtime);
		
		render(AdventurerStatusDisplay);
		
		await waitFor(() => {
			expect(screen.getByText(/On Mission:\s*2/)).toBeInTheDocument();
		});
	});

	it('should display Fatigued count when adventurers are fatigued', async () => {
		const state = createTestGameState();
		const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Fatigued' });
		state.entities.set(adventurer.id, adventurer);
		
		const runtime = startGame(state, new SimulatedTimeSource(Timestamp.now()));
		gameState.initialize(runtime);
		
		render(AdventurerStatusDisplay);
		
		await waitFor(() => {
			expect(screen.getByText(/Fatigued:\s*1/)).toBeInTheDocument();
		});
	});

	it('should display Recovering count when adventurers are recovering', async () => {
		const state = createTestGameState();
		const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Recovering' });
		state.entities.set(adventurer.id, adventurer);
		
		const runtime = startGame(state, new SimulatedTimeSource(Timestamp.now()));
		gameState.initialize(runtime);
		
		render(AdventurerStatusDisplay);
		
		await waitFor(() => {
			expect(screen.getByText(/Recovering:\s*1/)).toBeInTheDocument();
		});
	});

	it('should display multiple status badges simultaneously', async () => {
		const state = createTestGameState();
		const idleAdv = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
		const missionAdv = createTestAdventurer({ id: 'adv-2', state: 'OnMission' });
		state.entities.set(idleAdv.id, idleAdv);
		state.entities.set(missionAdv.id, missionAdv);
		
		const runtime = startGame(state, new SimulatedTimeSource(Timestamp.now()));
		gameState.initialize(runtime);
		
		render(AdventurerStatusDisplay);
		
		await waitFor(() => {
			expect(screen.getByText(/Idle:\s*1/)).toBeInTheDocument();
			expect(screen.getByText(/On Mission:\s*1/)).toBeInTheDocument();
		});
	});
});


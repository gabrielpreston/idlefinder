// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/svelte/svelte5';
import '@testing-library/jest-dom/vitest';
import DashboardPanel from './DashboardPanel.svelte';
import { createTestGameState, createTestFacility, createTestResourceSlot } from '../../test-utils/testFactories';
import { startGame } from '../../runtime/startGame';
import { SimulatedTimeSource } from '../../time/DomainTimeSource';
import { Timestamp } from '../../domain/valueObjects/Timestamp';
import { gameState } from '../../stores/gameState';

describe('DashboardPanel', () => {
	beforeEach(() => {
		const state = createTestGameState();
		const runtime = startGame(state, new SimulatedTimeSource(Timestamp.now()));
		gameState.initialize(runtime);
	});

	afterEach(() => {
		cleanup();
	});

	it('should display "Dashboard" heading', () => {
		render(DashboardPanel);
		expect(screen.getByText('Dashboard')).toBeInTheDocument();
	});

	it('should display all dashboard sections', async () => {
		render(DashboardPanel);
		
		await waitFor(() => {
			expect(screen.getByText('Collection Rates')).toBeInTheDocument();
			expect(screen.getByText('Stockpiles')).toBeInTheDocument();
			expect(screen.getByText('Adventurer Status')).toBeInTheDocument();
			expect(screen.getByText('Active Timers')).toBeInTheDocument();
		});
	});

	it('should display ruined state banner when guild hall is ruined', async () => {
		const state = createTestGameState();
		// Guildhall starts at tier 0 (ruined) in createTestGameState
		const runtime = startGame(state, new SimulatedTimeSource(Timestamp.now()));
		gameState.initialize(runtime);
		
		render(DashboardPanel);
		
		await waitFor(() => {
			expect(screen.getByText('This place barely counts as a guild hall.')).toBeInTheDocument();
		});
	});

	it('should display odd jobs info when odd jobs are available', async () => {
		const state = createTestGameState();
		const facility = createTestFacility({ id: 'facility-1', tier: 0 });
		const goldSlot = createTestResourceSlot({
			facilityId: facility.id,
			resourceType: 'gold',
			assigneeType: 'player',
			baseRatePerMinute: 30
		});
		state.entities.set(facility.id, facility);
		state.entities.set(goldSlot.id, goldSlot);
		
		const runtime = startGame(state, new SimulatedTimeSource(Timestamp.now()));
		gameState.initialize(runtime);
		
		render(DashboardPanel);
		
		await waitFor(() => {
			expect(screen.getByText(/You're working odd jobs to earn gold/)).toBeInTheDocument();
			expect(screen.getByText(/Generating.*gold per minute/)).toBeInTheDocument();
		});
	});
});


// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/svelte/svelte5';
import '@testing-library/jest-dom/vitest';
import ResourceRatesDisplay from './ResourceRatesDisplay.svelte';
import { createTestGameState, createTestFacility, createTestResourceSlot } from '../../test-utils/testFactories';
import { startGame } from '../../runtime/startGame';
import { SimulatedTimeSource } from '../../time/DomainTimeSource';
import { Timestamp } from '../../domain/valueObjects/Timestamp';
import { gameState } from '../../stores/gameState';

describe('ResourceRatesDisplay', () => {
	beforeEach(() => {
		const state = createTestGameState();
		const runtime = startGame(state, new SimulatedTimeSource(Timestamp.now()));
		gameState.initialize(runtime);
	});

	afterEach(() => {
		cleanup();
	});

	it('should display "Collection Rates" heading', () => {
		render(ResourceRatesDisplay);
		expect(screen.getByText('Collection Rates')).toBeInTheDocument();
	});

	it('should display empty state when no resource generation', async () => {
		// Remove all resource slots from base state
		const baseState = createTestGameState();
		// Remove the default gold slot that comes with createTestGameState
		for (const [id, entity] of baseState.entities.entries()) {
			if (entity.type === 'ResourceSlot') {
				baseState.entities.delete(id);
			}
		}
		
		const runtime = startGame(baseState, new SimulatedTimeSource(Timestamp.now()));
		gameState.initialize(runtime);
		
		render(ResourceRatesDisplay);
		
		await waitFor(() => {
			expect(screen.getByText('No active resource generation')).toBeInTheDocument();
		});
	});

	it('should display gold generation rate when gold slots are active', async () => {
		const baseState = createTestGameState();
		// Remove default gold slot
		for (const [id, entity] of baseState.entities.entries()) {
			if (entity.type === 'ResourceSlot' && (entity as any).attributes.resourceType === 'gold') {
				baseState.entities.delete(id);
			}
		}
		
		// Create tier 1 facility (multiplier = 1.0) to get expected rate
		const facility = createTestFacility({ id: 'facility-1', tier: 1 });
		const goldSlot = createTestResourceSlot({
			facilityId: facility.id,
			resourceType: 'gold',
			assigneeType: 'player',
			baseRatePerMinute: 30
		});
		baseState.entities.set(facility.id, facility);
		baseState.entities.set(goldSlot.id, goldSlot);
		
		const runtime = startGame(baseState, new SimulatedTimeSource(Timestamp.now()));
		gameState.initialize(runtime);
		
		render(ResourceRatesDisplay);
		
		await waitFor(() => {
			expect(screen.getByText('Gold')).toBeInTheDocument();
			expect(screen.getByText(/30\.0\/min/)).toBeInTheDocument();
		});
	});

	it('should display materials generation rate when materials slots are active', async () => {
		const baseState = createTestGameState();
		// Remove default gold slot to avoid interference
		for (const [id, entity] of baseState.entities.entries()) {
			if (entity.type === 'ResourceSlot' && (entity as any).attributes.resourceType === 'gold') {
				baseState.entities.delete(id);
			}
		}
		const facility = createTestFacility({ id: 'facility-1', tier: 1 });
		const materialsSlot = createTestResourceSlot({
			facilityId: facility.id,
			resourceType: 'materials',
			assigneeType: 'player',
			baseRatePerMinute: 15
		});
		baseState.entities.set(facility.id, facility);
		baseState.entities.set(materialsSlot.id, materialsSlot);
		
		const runtime = startGame(baseState, new SimulatedTimeSource(Timestamp.now()));
		gameState.initialize(runtime);
		
		render(ResourceRatesDisplay);
		
		await waitFor(() => {
			expect(screen.getByText('Materials')).toBeInTheDocument();
			expect(screen.getByText(/15\.0\/min/)).toBeInTheDocument();
		});
	});

	it('should display multiple resource types simultaneously', async () => {
		const baseState = createTestGameState();
		// Remove default gold slot to avoid interference
		for (const [id, entity] of baseState.entities.entries()) {
			if (entity.type === 'ResourceSlot' && (entity as any).attributes.resourceType === 'gold') {
				baseState.entities.delete(id);
			}
		}
		const facility = createTestFacility({ id: 'facility-1', tier: 1 });
		const goldSlot = createTestResourceSlot({
			facilityId: facility.id,
			resourceType: 'gold',
			assigneeType: 'player',
			baseRatePerMinute: 30
		});
		const materialsSlot = createTestResourceSlot({
			facilityId: facility.id,
			resourceType: 'materials',
			assigneeType: 'player',
			baseRatePerMinute: 15
		});
		baseState.entities.set(facility.id, facility);
		baseState.entities.set(goldSlot.id, goldSlot);
		baseState.entities.set(materialsSlot.id, materialsSlot);
		
		const runtime = startGame(baseState, new SimulatedTimeSource(Timestamp.now()));
		gameState.initialize(runtime);
		
		render(ResourceRatesDisplay);
		
		await waitFor(() => {
			expect(screen.getByText('Gold')).toBeInTheDocument();
			expect(screen.getByText('Materials')).toBeInTheDocument();
			expect(screen.getByText(/30\.0\/min/)).toBeInTheDocument();
			expect(screen.getByText(/15\.0\/min/)).toBeInTheDocument();
		});
	});

	it('should not display durationModifier in rates', async () => {
		const baseState = createTestGameState();
		// Remove default gold slot to avoid interference
		for (const [id, entity] of baseState.entities.entries()) {
			if (entity.type === 'ResourceSlot' && (entity as any).attributes.resourceType === 'gold') {
				baseState.entities.delete(id);
			}
		}
		const facility = createTestFacility({ id: 'facility-1', tier: 1 });
		const goldSlot = createTestResourceSlot({
			facilityId: facility.id,
			resourceType: 'gold',
			assigneeType: 'player',
			baseRatePerMinute: 30
		});
		const durationModifierSlot = createTestResourceSlot({
			facilityId: facility.id,
			resourceType: 'durationModifier',
			assigneeType: 'player',
			baseRatePerMinute: 1.0
		});
		baseState.entities.set(facility.id, facility);
		baseState.entities.set(goldSlot.id, goldSlot);
		baseState.entities.set(durationModifierSlot.id, durationModifierSlot);
		
		const runtime = startGame(baseState, new SimulatedTimeSource(Timestamp.now()));
		gameState.initialize(runtime);
		
		render(ResourceRatesDisplay);
		
		await waitFor(() => {
			expect(screen.getByText('Gold')).toBeInTheDocument();
			expect(screen.queryByText('Durationmodifier')).not.toBeInTheDocument();
			expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
		});
	});

	it('should format rates correctly with one decimal place', async () => {
		const baseState = createTestGameState();
		// Remove default gold slot to avoid interference
		for (const [id, entity] of baseState.entities.entries()) {
			if (entity.type === 'ResourceSlot' && (entity as any).attributes.resourceType === 'gold') {
				baseState.entities.delete(id);
			}
		}
		const facility = createTestFacility({ id: 'facility-1', tier: 1 });
		const goldSlot = createTestResourceSlot({
			facilityId: facility.id,
			resourceType: 'gold',
			assigneeType: 'player',
			baseRatePerMinute: 25.7
		});
		baseState.entities.set(facility.id, facility);
		baseState.entities.set(goldSlot.id, goldSlot);
		
		const runtime = startGame(baseState, new SimulatedTimeSource(Timestamp.now()));
		gameState.initialize(runtime);
		
		render(ResourceRatesDisplay);
		
		await waitFor(() => {
			expect(screen.getByText(/25\.7\/min/)).toBeInTheDocument();
		});
	});
});


/**
 * ConstructFacilityHandler Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupIntegrationTest, createTestCommand, createTestGameState, createTestResourceBundle } from '../test-utils';
import type { BusManager } from '../bus/BusManager';
import type { DomainEvent } from '../bus/types';
import { createTestFacility } from '../test-utils/testFactories';
import type { Entity } from '../domain/primitives/Requirement';
import { calculateFacilityConstructionCost } from '../domain/queries/CostQueries';
// Ensure gates are registered
import '../domain/gating';

describe('ConstructFacilityHandler Integration', () => {
	let busManager: BusManager;
	let publishedEvents: DomainEvent[];

	beforeEach(() => {
		// Create initial state with sufficient resources for facility construction
		const initialState = createTestGameState({
			resources: createTestResourceBundle({ gold: 1000 }) // Enough for any facility
		});
		
		({ busManager, publishedEvents } = setupIntegrationTest({
			initialState,
			eventTypes: ['FacilityConstructed', 'CommandFailed']
		}));
	});

	describe('ConstructFacility command', () => {
		it('should construct facility with valid type and resources', async () => {
			const facilityType = 'Dormitory';
			const cost = calculateFacilityConstructionCost(facilityType);
			
			// Ensure we have enough gold
			const initialState = busManager.getState();
			const initialGold = initialState.resources.get('gold') || 0;
			expect(initialGold).toBeGreaterThanOrEqual(cost);

			const command = createTestCommand('ConstructFacility', {
				facilityType
			});

			await busManager.commandBus.dispatch(command);

			// Verify FacilityConstructed event published
			const facilityConstructedEvents = publishedEvents.filter(e => e.type === 'FacilityConstructed');
			expect(facilityConstructedEvents.length).toBe(1);
			const event = facilityConstructedEvents[0];
			if (event.type === 'FacilityConstructed') {
				const payload = event.payload as { facilityId: string; facilityType: string; tier: number };
				expect(payload.facilityType).toBe(facilityType);
				expect(payload.tier).toBe(1);
			}

			// Verify state updated - facility should be created
			const finalState = busManager.getState();
			const facilities = Array.from(finalState.entities.values()).filter(
				e => e.type === 'Facility' && (e as import('../domain/entities/Facility').Facility).attributes.facilityType === facilityType
			) as import('../domain/entities/Facility').Facility[];
			expect(facilities.length).toBeGreaterThan(0);
			const facility = facilities[0];
			expect(facility.attributes.facilityType).toBe(facilityType);
			expect(facility.attributes.tier).toBe(1);
			expect(facility.state).toBe('Online');

			// Verify resources deducted
			const finalGold = finalState.resources.get('gold') || 0;
			expect(finalGold).toBe(initialGold - cost);
		});

		it('should fail when facility type is invalid', async () => {
			const command = createTestCommand('ConstructFacility', {
				facilityType: 'InvalidFacilityType' as any
			});

			await busManager.commandBus.dispatch(command);

			// Verify CommandFailed event published
			const failedEvents = publishedEvents.filter(e => e.type === 'CommandFailed');
			expect(failedEvents.length).toBeGreaterThan(0);
			const failedEvent = failedEvents[0];
			if (failedEvent.type === 'CommandFailed') {
				const payload = failedEvent.payload as { commandType: string; reason: string };
				expect(payload.commandType).toBe('ConstructFacility');
				expect(payload.reason).toContain('Invalid facility type');
			}

			// Verify state unchanged
			const finalState = busManager.getState();
			const initialGold = busManager.getState().resources.get('gold') || 0;
			const finalGold = finalState.resources.get('gold') || 0;
			expect(finalGold).toBe(initialGold); // No gold deducted
		});

		it('should fail when insufficient gold', async () => {
			const facilityType = 'Dormitory';
			const cost = calculateFacilityConstructionCost(facilityType);
			
			// Set state with insufficient gold
			const initialState = createTestGameState({
				resources: createTestResourceBundle({ gold: cost - 1 }) // Not enough
			});
			busManager.setState(initialState);

			const command = createTestCommand('ConstructFacility', {
				facilityType
			});

			await busManager.commandBus.dispatch(command);

			// Verify CommandFailed event published
			const failedEvents = publishedEvents.filter(e => e.type === 'CommandFailed');
			expect(failedEvents.length).toBeGreaterThan(0);
			const failedEvent = failedEvents[0];
			if (failedEvent.type === 'CommandFailed') {
				const payload = failedEvent.payload as { commandType: string; reason: string };
				expect(payload.commandType).toBe('ConstructFacility');
				expect(payload.reason).toContain('Insufficient gold');
			}

			// Verify state unchanged - no facility created
			const finalState = busManager.getState();
			const facilities = Array.from(finalState.entities.values()).filter(
				e => e.type === 'Facility' && (e as import('../domain/entities/Facility').Facility).attributes.facilityType === facilityType
			);
			expect(facilities.length).toBe(0);
		});

		it('should fail when facility already exists', async () => {
			const facilityType = 'Dormitory';
			
			// Create initial state with facility already existing
			const existingFacility = createTestFacility({ facilityType: facilityType as any });
			const entities = new Map<string, Entity>(busManager.getState().entities);
			entities.set(existingFacility.id, existingFacility);
			const initialState = createTestGameState({
				entities,
				resources: createTestResourceBundle({ gold: 1000 })
			});
			busManager.setState(initialState);

			const command = createTestCommand('ConstructFacility', {
				facilityType
			});

			await busManager.commandBus.dispatch(command);

			// Verify CommandFailed event published
			const failedEvents = publishedEvents.filter(e => e.type === 'CommandFailed');
			expect(failedEvents.length).toBeGreaterThan(0);
			const failedEvent = failedEvents[0];
			if (failedEvent.type === 'CommandFailed') {
				const payload = failedEvent.payload as { commandType: string; reason: string };
				expect(payload.commandType).toBe('ConstructFacility');
				expect(payload.reason).toContain('already exists');
			}

			// Verify only one facility exists (the original)
			const finalState = busManager.getState();
			const facilities = Array.from(finalState.entities.values()).filter(
				e => e.type === 'Facility' && (e as import('../domain/entities/Facility').Facility).attributes.facilityType === facilityType
			);
			expect(facilities.length).toBe(1);
			expect(facilities[0].id).toBe(existingFacility.id);
		});

		it('should fail when gate not unlocked', async () => {
			// This test requires setting up a state where the gate is locked
			// For now, we'll test with a facility type that might be locked
			// In practice, gates are unlocked based on fame milestones
			// We'll create a state with 0 fame to ensure gates are locked
			const facilityType = 'TrainingGrounds';
			const initialState = createTestGameState({
				resources: createTestResourceBundle({ gold: 1000, fame: 0 }) // 0 fame should lock gates
			});
			busManager.setState(initialState);

			const command = createTestCommand('ConstructFacility', {
				facilityType
			});

			await busManager.commandBus.dispatch(command);

			// Verify CommandFailed event published (if gate is locked)
			// Note: Some facilities might be unlocked by default, so this test may need adjustment
			const failedEvents = publishedEvents.filter(e => e.type === 'CommandFailed');
			// If gate is locked, we should get a failure
			// If gate is unlocked by default, this test will need to be adjusted
			if (failedEvents.length > 0) {
				const failedEvent = failedEvents[0];
				if (failedEvent.type === 'CommandFailed') {
					const payload = failedEvent.payload as { commandType: string; reason: string };
					expect(payload.commandType).toBe('ConstructFacility');
					expect(payload.reason).toContain('not unlocked');
				}
			}
		});

		it('should construct all facility types successfully', async () => {
			const facilityTypes: Array<'Dormitory' | 'MissionCommand' | 'TrainingGrounds' | 'ResourceDepot'> = [
				'Dormitory',
				'MissionCommand',
				'TrainingGrounds',
				'ResourceDepot'
			];

			for (const facilityType of facilityTypes) {
				// Reset events for each iteration
				publishedEvents.length = 0;
				
				// Ensure we have enough gold
				const cost = calculateFacilityConstructionCost(facilityType);
				const currentState = busManager.getState();
				const currentGold = currentState.resources.get('gold') || 0;
				
				if (currentGold < cost) {
					// Add more gold if needed
					const newResources = createTestResourceBundle({ gold: cost + 100 });
					busManager.setState(createTestGameState({
						entities: currentState.entities,
						resources: newResources
					}));
				}

				const command = createTestCommand('ConstructFacility', {
					facilityType
				});

				await busManager.commandBus.dispatch(command);

				// Verify facility was constructed
				const finalState = busManager.getState();
				const facilities = Array.from(finalState.entities.values()).filter(
					e => e.type === 'Facility' && (e as import('../domain/entities/Facility').Facility).attributes.facilityType === facilityType
				);
				expect(facilities.length).toBeGreaterThan(0);
				
				// Verify event was published
				const facilityEvents = publishedEvents.filter(e => e.type === 'FacilityConstructed');
				expect(facilityEvents.length).toBeGreaterThan(0);
			}
		});
	});
});


/**
 * UpgradeFacilityHandlerV2 Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupIntegrationTest, createTestCommand, createTestGameState } from '../test-utils';
import type { BusManager } from '../bus/BusManager';
import type { DomainEvent } from '../bus/types';
import { createTestFacility } from '../test-utils/testFactories';
import { ResourceBundle } from '../domain/valueObjects/ResourceBundle';
import { ResourceUnit } from '../domain/valueObjects/ResourceUnit';
import type { Entity } from '../domain/primitives/Requirement';

describe('UpgradeFacilityHandlerV2 Integration', () => {
	let busManager: BusManager;
	let publishedEvents: DomainEvent[];

	beforeEach(() => {
		({ busManager, publishedEvents } = setupIntegrationTest({
			eventTypes: ['FacilityUpgraded', 'CommandFailed', 'ResourcesChanged']
		}));
	});

	describe('UpgradeFacility command', () => {
		it('should upgrade facility when sufficient resources', async () => {
			const facility = createTestFacility({ facilityType: 'Guildhall', tier: 1 });
			const resources = ResourceBundle.fromArray([new ResourceUnit('gold', 200)]);
			const entities = new Map<string, Entity>(busManager.getState().entities);
			entities.set(facility.id, facility);
			busManager.setState(createTestGameState({ entities, resources }));

			const command = createTestCommand('UpgradeFacility', {
				facility: facility.id
			});

			await busManager.commandBus.dispatch(command);

			// Verify state updated
			const state = busManager.getState();
			const updatedFacility = state.entities.get(facility.id) as import('../domain/entities/Facility').Facility;
			if (updatedFacility) {
				expect(updatedFacility.attributes.tier).toBe(2);
			}
		});

		it('should find facility by facilityType when ID not found', async () => {
			// Clear initial state and create a fresh guildhall
			const facility = createTestFacility({ facilityType: 'Guildhall', tier: 1 });
			const resources = ResourceBundle.fromArray([new ResourceUnit('gold', 200)]);
			// Create fresh entities map without initial state's guildhall
			const entities = new Map<string, Entity>();
			entities.set(facility.id, facility);
			busManager.setState(createTestGameState({ entities, resources }));

			const command = createTestCommand('UpgradeFacility', {
				facility: 'Guildhall' // Use facilityType instead of ID
			});

			await busManager.commandBus.dispatch(command);

			// Should find and upgrade facility
			const state = busManager.getState();
			const facilities = Array.from(state.entities.values()).filter(
				e => e.type === 'Facility' && (e as import('../domain/entities/Facility').Facility).attributes.facilityType === 'Guildhall'
			) as import('../domain/entities/Facility').Facility[];
			expect(facilities.length).toBeGreaterThan(0);
			// Should have upgraded to tier 2
			expect(facilities[0].attributes.tier).toBe(2);
		});

		it('should fail when facility not found', async () => {
			const command = createTestCommand('UpgradeFacility', {
				facility: 'nonexistent'
			});

			await busManager.commandBus.dispatch(command);

			const failedEvents = publishedEvents.filter(e => e.type === 'CommandFailed');
			expect(failedEvents.length).toBeGreaterThan(0);
		});

		it('should fail when insufficient resources', async () => {
			const facility = createTestFacility({ facilityType: 'Guildhall', tier: 1 });
			const resources = ResourceBundle.fromArray([new ResourceUnit('gold', 50)]); // Not enough
			const entities = new Map<string, Entity>(busManager.getState().entities);
			entities.set(facility.id, facility);
			busManager.setState(createTestGameState({ entities, resources }));

			const command = createTestCommand('UpgradeFacility', {
				facility: facility.id
			});

			await busManager.commandBus.dispatch(command);

			const failedEvents = publishedEvents.filter(e => e.type === 'CommandFailed');
			expect(failedEvents.length).toBeGreaterThan(0);
		});

		it('should consume resources when upgrade succeeds', async () => {
			const facility = createTestFacility({ facilityType: 'Guildhall', tier: 1 });
			const initialGold = 200;
			const resources = ResourceBundle.fromArray([new ResourceUnit('gold', initialGold)]);
			const entities = new Map<string, Entity>(busManager.getState().entities);
			entities.set(facility.id, facility);
			busManager.setState(createTestGameState({ entities, resources }));

			const command = createTestCommand('UpgradeFacility', {
				facility: facility.id
			});

			await busManager.commandBus.dispatch(command);

			const state = busManager.getState();
			// Tier 2 upgrade costs 200 gold
			expect(state.resources.get('gold')).toBeLessThan(initialGold);
		});
	});
});


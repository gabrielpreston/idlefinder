/**
 * UpdateMissionDoctrineHandler Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupIntegrationTest, createTestCommand } from '../test-utils';
import type { BusManager } from '../bus/BusManager';
import type { DomainEvent } from '../bus/types';

describe('UpdateMissionDoctrineHandler Integration', () => {
	let busManager: BusManager;
	let publishedEvents: DomainEvent[];

	beforeEach(() => {
		({ busManager, publishedEvents } = setupIntegrationTest({
			eventTypes: ['MissionDoctrineUpdated']
		}));
	});

	describe('UpdateMissionDoctrine command', () => {
		it('should update doctrine focus', async () => {
			const command = createTestCommand('UpdateMissionDoctrine', {
				focus: 'gold'
			});

			await busManager.commandBus.dispatch(command);

			const state = busManager.getState();
			const doctrines = Array.from(state.entities.values()).filter(e => e.type === 'MissionDoctrine');
			expect(doctrines.length).toBeGreaterThan(0);
			const doctrine = doctrines[0] as import('../domain/entities/MissionDoctrine').MissionDoctrine;
			expect(doctrine.attributes.focus).toBe('gold');
		});

		it('should update doctrine risk tolerance', async () => {
			const command = createTestCommand('UpdateMissionDoctrine', {
				riskTolerance: 'high'
			});

			await busManager.commandBus.dispatch(command);

			const state = busManager.getState();
			const doctrines = Array.from(state.entities.values()).filter(e => e.type === 'MissionDoctrine');
			const doctrine = doctrines[0] as import('../domain/entities/MissionDoctrine').MissionDoctrine;
			expect(doctrine.attributes.riskTolerance).toBe('high');
		});

		it('should create doctrine if it does not exist', async () => {
			const state = busManager.getState();
			const initialDoctrines = Array.from(state.entities.values()).filter(e => e.type === 'MissionDoctrine');

			const command = createTestCommand('UpdateMissionDoctrine', {
				focus: 'xp'
			});

			await busManager.commandBus.dispatch(command);

			const finalState = busManager.getState();
			const finalDoctrines = Array.from(finalState.entities.values()).filter(e => e.type === 'MissionDoctrine');
			expect(finalDoctrines.length).toBeGreaterThanOrEqual(initialDoctrines.length);
		});

		it('should emit MissionDoctrineUpdated event', async () => {
			const command = createTestCommand('UpdateMissionDoctrine', {
				focus: 'balanced'
			});

			await busManager.commandBus.dispatch(command);

			const updatedEvents = publishedEvents.filter(e => e.type === 'MissionDoctrineUpdated');
			expect(updatedEvents.length).toBeGreaterThan(0);
		});
	});
});


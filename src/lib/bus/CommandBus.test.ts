/**
 * CommandBus Tests - Fast unit tests with mocked handlers
 * Speed target: <200ms total
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { CommandBus } from './CommandBus';
import { DomainEventBus } from './DomainEventBus';
import type { DomainEvent } from './types';
import { createTestGameState, createTestCommand } from '../test-utils';
import type { GameState } from '../domain/entities/GameState';

describe('CommandBus', () => {
	let commandBus: CommandBus<GameState>;
	let domainEventBus: DomainEventBus;
	let state: GameState;
	let stateGetter: () => GameState;
	let stateSetter: Mock<(state: GameState) => void>;

	beforeEach(() => {
		state = createTestGameState();
		domainEventBus = new DomainEventBus();
		stateSetter = vi.fn((newState) => {
			state = newState;
		});
		stateGetter = () => state;

		commandBus = new CommandBus(domainEventBus, stateGetter, stateSetter);
	});

	describe('handler registration', () => {
		it('should register a handler', () => {
			const handler = vi.fn().mockResolvedValue({
				newState: state,
				events: []
			});

			commandBus.register('StartMission', handler);

			// Handler registered (no error thrown)
			expect(handler).toBeDefined();
		});
	});

	describe('command dispatch', () => {
		it('should dispatch command to registered handler', async () => {
			const handler = vi.fn().mockResolvedValue({
				newState: state,
				events: []
			});

			commandBus.register('StartMission', handler);

			const command = createTestCommand('StartMission', {
				missionId: 'mission-1',
				adventurerIds: []
			});

			await commandBus.dispatch(command);

			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler).toHaveBeenCalledWith(command.payload, state);
		});

		it('should update state after handler execution', async () => {
			const newState = createTestGameState();
			const handler = vi.fn().mockResolvedValue({
				newState,
				events: []
			});

			commandBus.register('StartMission', handler);

			const command = createTestCommand('StartMission', {
				missionId: 'mission-1',
				adventurerIds: []
			});

			await commandBus.dispatch(command);

			expect(stateSetter).toHaveBeenCalledWith(newState);
		});

		it('should publish events after handler execution', async () => {
			const event: DomainEvent = {
				type: 'MissionStarted',
				payload: {
					missionId: 'mission-1',
					adventurerIds: [],
					startTime: new Date().toISOString(),
					duration: 60000
				},
				timestamp: new Date().toISOString()
			};

			const handler = vi.fn().mockResolvedValue({
				newState: state,
				events: [event]
			});

			commandBus.register('StartMission', handler);

			const publishedEvents: DomainEvent[] = [];
			domainEventBus.subscribe('MissionStarted', (payload: DomainEvent['payload']) => {
				publishedEvents.push({ ...event, payload: payload as DomainEvent['payload'] });
			});

			const command = createTestCommand('StartMission', {
				missionId: 'mission-1',
				adventurerIds: []
			});

			await commandBus.dispatch(command);

			expect(publishedEvents).toHaveLength(1);
		});
	});

	describe('error handling', () => {
		it('should emit CommandFailed when handler is missing', async () => {
			const command = createTestCommand('StartMission', {
				missionId: 'mission-1',
				adventurerIds: []
			});

			const failedEvents: DomainEvent[] = [];
			domainEventBus.subscribe('CommandFailed', (payload) => {
				failedEvents.push({
					type: 'CommandFailed',
					payload: payload as DomainEvent['payload'],
					timestamp: new Date().toISOString()
				});
			});

			await commandBus.dispatch(command);

			expect(failedEvents).toHaveLength(1);
			expect(failedEvents[0].payload).toMatchObject({
				commandType: 'StartMission',
				reason: expect.stringContaining('No handler registered')
			});
		});

		it('should emit CommandFailed when handler throws error', async () => {
			const handler = vi.fn().mockRejectedValue(new Error('Handler error'));

			commandBus.register('StartMission', handler);

			const command = createTestCommand('StartMission', {
				missionId: 'mission-1',
				adventurerIds: []
			});

			const failedEvents: DomainEvent[] = [];
			domainEventBus.subscribe('CommandFailed', (payload) => {
				failedEvents.push({
					type: 'CommandFailed',
					payload: payload as DomainEvent['payload'],
					timestamp: new Date().toISOString()
				});
			});

			await commandBus.dispatch(command);

			expect(failedEvents).toHaveLength(1);
			expect(failedEvents[0].payload).toMatchObject({
				commandType: 'StartMission',
				reason: 'Handler error'
			});
		});
	});
});


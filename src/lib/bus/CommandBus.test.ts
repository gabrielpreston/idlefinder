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
import { SimulatedTimeSource } from '../time/DomainTimeSource';
import { Timestamp } from '../domain/valueObjects/Timestamp';

describe('CommandBus', () => {
	let commandBus: CommandBus<GameState>;
	let domainEventBus: DomainEventBus;
	let state: GameState;
	let stateGetter: () => GameState;
	let stateSetter: Mock<(state: GameState) => void>;
	let timeSource: SimulatedTimeSource;

	beforeEach(() => {
		state = createTestGameState();
		domainEventBus = new DomainEventBus();
		stateSetter = vi.fn((newState) => {
			state = newState;
		});
		stateGetter = () => state;
		timeSource = new SimulatedTimeSource(Timestamp.from(Date.now()));

		commandBus = new CommandBus(domainEventBus, stateGetter, stateSetter, timeSource);
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
			expect(handler).toHaveBeenCalledWith(
				command.payload,
				state,
				expect.objectContaining({
					currentTime: expect.any(Object)
				})
			);
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
				publishedEvents.push({ ...event, payload: payload });
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

		it('should emit CommandFailed when handler throws non-Error', async () => {
			const handler = vi.fn().mockRejectedValue('String error');

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
				reason: 'String error'
			});
		});
	});

	describe('processQueue error handling', () => {
		it('should publish CommandFailed event when handler throws error', async () => {
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

			// CommandBus catches errors and publishes CommandFailed, doesn't reject promise
			await commandBus.dispatch(command);

			expect(failedEvents).toHaveLength(1);
			expect(failedEvents[0].payload).toMatchObject({
				commandType: 'StartMission',
				reason: 'Handler error'
			});
		});

		it('should publish CommandFailed event when handler throws non-Error', async () => {
			const handler = vi.fn().mockRejectedValue('String error');

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

			// CommandBus catches errors and publishes CommandFailed, doesn't reject promise
			await commandBus.dispatch(command);

			expect(failedEvents).toHaveLength(1);
			expect(failedEvents[0].payload).toMatchObject({
				commandType: 'StartMission',
				reason: 'String error'
			});
		});
	});

	describe('command queue processing', () => {
		it('should queue commands when already processing', async () => {
			// Create a handler that takes time to complete
			let resolveHandler: (() => void) | undefined;
			const handlerPromise = new Promise<void>((resolve) => {
				resolveHandler = resolve;
			});

			const handler = vi.fn().mockImplementation(async () => {
				await handlerPromise;
				return {
					newState: state,
					events: []
				};
			});

			commandBus.register('StartMission', handler);

			// Dispatch first command (starts processing)
			const command1 = createTestCommand('StartMission', {
				missionId: 'mission-1',
				adventurerIds: []
			});
			const dispatch1Promise = commandBus.dispatch(command1);

			// Dispatch second command while first is still processing
			// This tests the branch where isProcessing is true
			const command2 = createTestCommand('StartMission', {
				missionId: 'mission-2',
				adventurerIds: []
			});
			const dispatch2Promise = commandBus.dispatch(command2);

			// Verify both commands are queued
			expect(handler).toHaveBeenCalledTimes(1); // Only first command started

		// Resolve first handler
		// resolveHandler is guaranteed to be assigned by the Promise constructor
		if (!resolveHandler) {
			throw new Error('resolveHandler not assigned');
		}
		resolveHandler();
			await dispatch1Promise;

			// Now second command should be processed
			await dispatch2Promise;
			expect(handler).toHaveBeenCalledTimes(2);
		});
	});
});


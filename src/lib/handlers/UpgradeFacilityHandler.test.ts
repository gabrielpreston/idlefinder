/**
 * UpgradeFacilityHandler Tests - Fast unit tests with mocked FacilitySystem
 * Speed target: <300ms total
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createUpgradeFacilityHandler } from './UpgradeFacilityHandler';
import { FacilitySystem } from '../domain/systems/FacilitySystem';
import { createTestPlayerState } from '../test-utils';

describe('UpgradeFacilityHandler', () => {
	let facilitySystem: FacilitySystem;
	let handler: ReturnType<typeof createUpgradeFacilityHandler>;

	beforeEach(() => {
		facilitySystem = new FacilitySystem();
		handler = createUpgradeFacilityHandler(facilitySystem);
	});

	describe('valid command', () => {
		it('should emit FacilityUpgraded and ResourcesChanged events', async () => {
			const state = createTestPlayerState({
				resources: { gold: 1000, supplies: 100, relics: 0 }
			});

			const result = await handler(
				{
					facility: 'tavern'
				},
				state
			);

			expect(result.events).toHaveLength(2);
			expect(result.events[0].type).toBe('FacilityUpgraded');
			expect(result.events[1].type).toBe('ResourcesChanged');

			const upgradedEvent = result.events[0].payload as { facility: string; newLevel: number; effects: string[] };
			expect(upgradedEvent.facility).toBe('tavern');
			expect(upgradedEvent.newLevel).toBe(2);
		});

		it('should upgrade facility level', async () => {
			const state = createTestPlayerState({
				resources: { gold: 1000, supplies: 100, relics: 0 }
			});

			const result = await handler(
				{
					facility: 'tavern'
				},
				state
			);

			expect(result.newState.facilities.tavern.level).toBe(2);
		});

		it('should deduct resources', async () => {
			const state = createTestPlayerState({
				resources: { gold: 1000, supplies: 100, relics: 0 }
			});

			const result = await handler(
				{
					facility: 'tavern'
				},
				state
			);

			// Level 1 -> 2 costs 100 gold, 10 supplies
			expect(result.newState.resources.gold).toBe(900);
			expect(result.newState.resources.supplies).toBe(90);
		});
	});

	describe('error handling', () => {
		it('should emit CommandFailed when facility is invalid', async () => {
			const state = createTestPlayerState();

			const result = await handler(
				{
					facility: 'invalid-facility'
				},
				state
			);

			expect(result.events).toHaveLength(1);
			expect(result.events[0].type).toBe('CommandFailed');
			expect(result.events[0].payload).toMatchObject({
				commandType: 'UpgradeFacility',
				reason: expect.stringContaining('Invalid facility')
			});
		});

		it('should emit CommandFailed when insufficient resources', async () => {
			const state = createTestPlayerState({
				resources: { gold: 50, supplies: 5, relics: 0 } // Not enough for upgrade
			});

			const result = await handler(
				{
					facility: 'tavern'
				},
				state
			);

			expect(result.events).toHaveLength(1);
			expect(result.events[0].type).toBe('CommandFailed');
			expect(result.events[0].payload).toMatchObject({
				commandType: 'UpgradeFacility',
				reason: expect.stringContaining('Insufficient resources')
			});
		});

		it('should emit CommandFailed when facility at max level', async () => {
			const state = createTestPlayerState({
				resources: { gold: 10000, supplies: 1000, relics: 0 },
				facilities: {
					tavern: { level: 10, effects: [] },
					guildHall: { level: 1, effects: [] },
					blacksmith: { level: 1, effects: [] }
				}
			});

			const result = await handler(
				{
					facility: 'tavern'
				},
				state
			);

			expect(result.events).toHaveLength(1);
			expect(result.events[0].type).toBe('CommandFailed');
			expect(result.events[0].payload).toMatchObject({
				commandType: 'UpgradeFacility',
				reason: expect.stringContaining('cannot be upgraded')
			});
		});
	});
});


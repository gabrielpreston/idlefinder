/**
 * Mission Duration Modifiers Tests
 */

import { describe, it, expect } from 'vitest';
import { calculateEffectiveDuration } from './MissionDurationModifiers';
import { createTestMission } from '../../test-utils/testFactories';
import { createTestAdventurer } from '../../test-utils/testFactories';
import { GameState } from '../entities/GameState';
import { Timestamp } from '../valueObjects/Timestamp';
import { Duration } from '../valueObjects/Duration';
import { ResourceBundle } from '../valueObjects/ResourceBundle';

describe('MissionDurationModifiers', () => {
	describe('calculateEffectiveDuration', () => {
		it('should return base duration when no modifiers are applied', () => {
			const mission = createTestMission({
				baseDuration: Duration.ofSeconds(60)
			});
			const gameState = new GameState(
				'test-player',
				Timestamp.now(),
				new Map(),
				ResourceBundle.fromArray([])
			);

			const effectiveDuration = calculateEffectiveDuration(mission, undefined, gameState);

			expect(effectiveDuration.toMilliseconds()).toBe(60000); // 60 seconds
		});

		it('should return base duration when adventurer is provided but no modifiers', () => {
			const mission = createTestMission({
				baseDuration: Duration.ofSeconds(30)
			});
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map([[adventurer.id, adventurer]]);
			const gameState = new GameState(
				'test-player',
				Timestamp.now(),
				entities,
				ResourceBundle.fromArray([])
			);

			const effectiveDuration = calculateEffectiveDuration(mission, adventurer, gameState);

			expect(effectiveDuration.toMilliseconds()).toBe(30000); // 30 seconds
		});

		it('should enforce minimum duration of 1 second', () => {
			const mission = createTestMission({
				baseDuration: Duration.ofSeconds(0.5) // Less than 1 second
			});
			const gameState = new GameState(
				'test-player',
				Timestamp.now(),
				new Map(),
				ResourceBundle.fromArray([])
			);

			const effectiveDuration = calculateEffectiveDuration(mission, undefined, gameState);

			// Should be at least 1 second (1000ms)
			expect(effectiveDuration.toMilliseconds()).toBeGreaterThanOrEqual(1000);
		});

		it('should handle sub-second durations correctly', () => {
			const mission = createTestMission({
				baseDuration: Duration.ofSeconds(0.5) // 500ms
			});
			const gameState = new GameState(
				'test-player',
				Timestamp.now(),
				new Map(),
				ResourceBundle.fromArray([])
			);

			const effectiveDuration = calculateEffectiveDuration(mission, undefined, gameState);

			// Should be clamped to minimum 1 second
			expect(effectiveDuration.toMilliseconds()).toBe(1000);
		});

		it('should handle various mission durations', () => {
			const testCases = [
				{ baseSeconds: 30, expectedMs: 30000 },
				{ baseSeconds: 60, expectedMs: 60000 },
				{ baseSeconds: 120, expectedMs: 120000 },
				{ baseSeconds: 0.1, expectedMs: 1000 } // Minimum enforced
			];

			for (const testCase of testCases) {
				const mission = createTestMission({
					baseDuration: Duration.ofSeconds(testCase.baseSeconds)
				});
				const gameState = new GameState(
					'test-player',
					Timestamp.now(),
					new Map(),
					ResourceBundle.fromArray([])
				);

				const effectiveDuration = calculateEffectiveDuration(mission, undefined, gameState);

				expect(effectiveDuration.toMilliseconds()).toBe(testCase.expectedMs);
			}
		});
	});
});


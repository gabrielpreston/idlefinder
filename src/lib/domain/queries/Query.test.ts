/**
 * Query Tests - Core query types and context helpers
 */

import { describe, it, expect } from 'vitest';
import { createQueryContext } from './Query';
import { createTestGameState } from '../../test-utils/testFactories';
import { Timestamp } from '../valueObjects/Timestamp';

describe('Query', () => {
	describe('createQueryContext', () => {
		it('should create RequirementContext from GameState and Timestamp', () => {
			const state = createTestGameState();
			const time = Timestamp.now();

			const context = createQueryContext(state, time);

			expect(context.entities).toBe(state.entities);
			expect(context.resources).toBe(state.resources);
			expect(context.currentTime).toBe(time);
		});

		it('should use provided entities from GameState', () => {
			const state = createTestGameState();
			const time = Timestamp.now();

			const context = createQueryContext(state, time);

			expect(context.entities).toBeInstanceOf(Map);
			expect(context.entities).toBe(state.entities);
		});

		it('should use provided resources from GameState', () => {
			const state = createTestGameState();
			const time = Timestamp.now();

			const context = createQueryContext(state, time);

			expect(context.resources).toBe(state.resources);
		});

		it('should use provided timestamp', () => {
			const state = createTestGameState();
			const time = Timestamp.from(Date.now() + 1000);

			const context = createQueryContext(state, time);

			expect(context.currentTime).toBe(time);
			expect(context.currentTime.value).toBe(time.value);
		});
	});
});


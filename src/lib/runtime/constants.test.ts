/**
 * Runtime Constants Tests
 */

import { describe, it, expect } from 'vitest';
import { GAME_RUNTIME_KEY } from './constants';

describe('Runtime Constants', () => {
	describe('GAME_RUNTIME_KEY', () => {
		it('should be a Symbol', () => {
			expect(typeof GAME_RUNTIME_KEY).toBe('symbol');
		});

		it('should have unique identity', () => {
			const key1 = GAME_RUNTIME_KEY;
			const key2 = GAME_RUNTIME_KEY;
			expect(key1).toBe(key2);
		});
	});
});


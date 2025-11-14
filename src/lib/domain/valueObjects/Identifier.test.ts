import { describe, it, expect } from 'vitest';
import { Identifier } from './Identifier';
import type {
	OrganizationId,
	AgentId,
	TaskInstanceId
} from './Identifier';

describe('Identifier', () => {
	describe('generate', () => {
		it('should generate a valid UUID', () => {
			const id: OrganizationId = Identifier.generate();
			expect(id.value).toBeDefined();
			expect(id.value.length).toBeGreaterThan(0);
			expect(id.isValid()).toBe(true);
		});

		it('should generate unique identifiers', () => {
			const id1: OrganizationId = Identifier.generate();
			const id2: OrganizationId = Identifier.generate();
			expect(id1.value).not.toBe(id2.value);
		});
	});

	describe('from', () => {
		it('should create identifier from valid string', () => {
			const id: OrganizationId = Identifier.from('test-id-123');
			expect(id.value).toBe('test-id-123');
			expect(id.isValid()).toBe(true);
		});

		it('should throw error for empty string', () => {
			expect(() => {
				Identifier.from('') as OrganizationId;
			}).toThrow('Identifier value cannot be empty');
		});

		it('should throw error for whitespace-only string', () => {
			expect(() => {
				Identifier.from('   ') as OrganizationId;
			}).toThrow('Identifier value cannot be empty');
		});
	});

	describe('equals', () => {
		it('should return true for equal identifiers', () => {
			const id1: OrganizationId = Identifier.from('test-id');
			const id2: OrganizationId = Identifier.from('test-id');
			expect(id1.equals(id2)).toBe(true);
		});

		it('should return false for different identifiers', () => {
			const id1: OrganizationId = Identifier.from('test-id-1');
			const id2: OrganizationId = Identifier.from('test-id-2');
			expect(id1.equals(id2)).toBe(false);
		});
	});

	describe('isValid', () => {
		it('should return true for valid identifier', () => {
			const id: OrganizationId = Identifier.from('valid-id');
			expect(id.isValid()).toBe(true);
		});
	});

	describe('type safety', () => {
		it('should prevent mixing different ID types', () => {
			const orgId: OrganizationId = Identifier.generate();
			const agentId: AgentId = Identifier.generate();
			const taskId: TaskInstanceId = Identifier.generate();

			// TypeScript should prevent these comparisons at compile time
			// But we can test that they are not equal at runtime
			expect(orgId.equals(agentId as unknown as OrganizationId)).toBe(false);
			expect(orgId.equals(taskId as unknown as OrganizationId)).toBe(false);
		});
	});
});


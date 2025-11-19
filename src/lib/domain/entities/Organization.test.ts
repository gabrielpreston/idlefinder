/**
 * Organization Entity Tests
 */

import { describe, it, expect } from 'vitest';
import { Organization } from './Organization';
import { Identifier } from '../valueObjects/Identifier';
import { Timestamp } from '../valueObjects/Timestamp';
import { ResourceBundle } from '../valueObjects/ResourceBundle';
import { ResourceUnit } from '../valueObjects/ResourceUnit';
import { ProgressTrack } from './ProgressTrack';

function createTestOrganization(overrides?: {
	wallet?: ResourceBundle;
	lastSimulatedAt?: Timestamp;
}): Organization {
	const orgId = Identifier.generate<'OrganizationId'>();
	const playerId = Identifier.generate<'PlayerId'>();
	const now = Timestamp.now();
	const wallet = overrides?.wallet || ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);
	const lastSimulatedAt = overrides?.lastSimulatedAt || now;
	return new Organization(
		orgId,
		playerId,
		now,
		now,
		new Map(),
		{ wallet },
		lastSimulatedAt
	);
}

describe('Organization', () => {
	describe('constructor', () => {
		it('should create valid organization', () => {
			const org = createTestOrganization();
			expect(org.id).toBeDefined();
			expect(org.economyState.wallet).toBeDefined();
		});

		it('should throw error when wallet is missing', () => {
			const orgId = Identifier.generate<'OrganizationId'>();
			const playerId = Identifier.generate<'PlayerId'>();
			const now = Timestamp.now();

			expect(() => new Organization(
				orgId,
				playerId,
				now,
				now,
				new Map(),
				{ wallet: null as any },
				now
			)).toThrow('Organization economyState.wallet is required');
		});

		it('should throw error when lastSimulatedAt is before createdAt', () => {
			const orgId = Identifier.generate<'OrganizationId'>();
			const playerId = Identifier.generate<'PlayerId'>();
			const now = Timestamp.now();
			const past = Timestamp.from(now.value - 1000);

			expect(() => new Organization(
				orgId,
				playerId,
				now,
				now,
				new Map(),
				{ wallet: ResourceBundle.fromArray([new ResourceUnit('gold', 100)]) },
				past
			)).toThrow('lastSimulatedAt cannot be before createdAt');
		});
	});

	describe('canAfford', () => {
		it('should return true when organization has enough resources', () => {
			const org = createTestOrganization();
			const cost = ResourceBundle.fromArray([new ResourceUnit('gold', 50)]);

			expect(org.canAfford(cost)).toBe(true);
		});

		it('should return false when organization lacks resources', () => {
			const org = createTestOrganization();
			const cost = ResourceBundle.fromArray([new ResourceUnit('gold', 200)]);

			expect(org.canAfford(cost)).toBe(false);
		});
	});

	describe('advanceTo', () => {
		it('should advance simulation time', () => {
			const now = Timestamp.now();
			const org = createTestOrganization({ lastSimulatedAt: now });
			const future = Timestamp.from(now.value + 1000);

			org.advanceTo(future);

			expect(org.lastSimulatedAt).toBe(future);
			expect(org.lastActiveAt).toBe(future);
		});

		it('should throw error when advancing to past time', () => {
			const now = Timestamp.now();
			const org = createTestOrganization({ lastSimulatedAt: now });
			const past = Timestamp.from(now.value - 1000);

			expect(() => org.advanceTo(past)).toThrow('Cannot advance to time before lastSimulatedAt');
		});
	});

	describe('getProgressTrack', () => {
		it('should return progress track by key', () => {
			const orgId = Identifier.generate<'OrganizationId'>();
			const playerId = Identifier.generate<'PlayerId'>();
			const now = Timestamp.now();
			const track = new ProgressTrack(
				Identifier.generate<'ProgressTrackId'>(),
				orgId,
				'test-track',
				100
			);
			const tracks = new Map([['test-track', track]]);
			const org = new Organization(
				orgId,
				playerId,
				now,
				now,
				tracks,
				{ wallet: ResourceBundle.fromArray([new ResourceUnit('gold', 100)]) },
				now
			);

			expect(org.getProgressTrack('test-track')).toBe(track);
		});

		it('should return undefined for non-existent track', () => {
			const org = createTestOrganization();

			expect(org.getProgressTrack('nonexistent')).toBeUndefined();
		});
	});
});


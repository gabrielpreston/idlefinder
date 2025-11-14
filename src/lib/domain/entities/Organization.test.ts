import { describe, it, expect } from 'vitest';
import { Organization } from './Organization';
import { Identifier } from '$lib/domain/valueObjects/Identifier';
import { Timestamp } from '$lib/domain/valueObjects/Timestamp';
import { Duration } from '$lib/domain/valueObjects/Duration';
import { ResourceBundle, ResourceUnit } from '$lib/domain/valueObjects';
import { ProgressTrack } from './ProgressTrack';
import type { OrganizationId, PlayerId } from '$lib/domain/valueObjects/Identifier';

describe('Organization', () => {
	const createOrganization = (): {
		org: Organization;
		orgId: OrganizationId;
		playerId: PlayerId;
		createdAt: Timestamp;
	} => {
		const orgId: OrganizationId = Identifier.generate();
		const playerId: PlayerId = Identifier.generate();
		const createdAt = Timestamp.now();
		const wallet = ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);
		const progressTracks = new Map<string, ProgressTrack>();
		const org = new Organization(
			orgId,
			playerId,
			createdAt,
			createdAt,
			progressTracks,
			{ wallet },
			createdAt
		);
		return { org, orgId, playerId, createdAt };
	};

	describe('constructor', () => {
		it('should create valid organization', () => {
			const { org } = createOrganization();
			expect(org.id).toBeDefined();
			expect(org.economyState.wallet).toBeDefined();
		});

		it('should throw error for missing wallet', () => {
			const orgId: OrganizationId = Identifier.generate();
			const playerId: PlayerId = Identifier.generate();
			const createdAt = Timestamp.now();
			expect(
				() =>
					new Organization(
						orgId,
						playerId,
						createdAt,
						createdAt,
						new Map(),
						{ wallet: null as unknown as ResourceBundle },
						createdAt
					)
			).toThrow('Organization economyState.wallet is required');
		});

		it('should throw error if lastSimulatedAt is before createdAt', () => {
			const orgId: OrganizationId = Identifier.generate();
			const playerId: PlayerId = Identifier.generate();
			const createdAt = Timestamp.now();
			const earlier = createdAt.subtract(Duration.ofSeconds(1));
			const wallet = ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);
			expect(
				() =>
					new Organization(
						orgId,
						playerId,
						createdAt,
						createdAt,
						new Map(),
						{ wallet },
						earlier
					)
			).toThrow('lastSimulatedAt cannot be before createdAt');
		});
	});

	describe('canAfford', () => {
		it('should return true when wallet has sufficient resources', () => {
			const { org } = createOrganization();
			const cost = ResourceBundle.fromArray([new ResourceUnit('gold', 50)]);
			expect(org.canAfford(cost)).toBe(true);
		});

		it('should return false when wallet lacks resources', () => {
			const { org } = createOrganization();
			const cost = ResourceBundle.fromArray([new ResourceUnit('gold', 200)]);
			expect(org.canAfford(cost)).toBe(false);
		});
	});

	describe('advanceTo', () => {
		it('should update lastSimulatedAt and lastActiveAt', () => {
			const { org, createdAt } = createOrganization();
			const later = createdAt.add(Duration.ofSeconds(1));
			org.advanceTo(later);
			expect(org.lastSimulatedAt.equals(later)).toBe(true);
			expect(org.lastActiveAt.equals(later)).toBe(true);
		});

		it('should throw error if advancing to time before lastSimulatedAt', () => {
			const { org, createdAt } = createOrganization();
			const later = createdAt.add(Duration.ofSeconds(1));
			org.advanceTo(later);
			const earlier = createdAt.subtract(Duration.ofSeconds(1));
			expect(() => org.advanceTo(earlier)).toThrow('Cannot advance to time before lastSimulatedAt');
		});
	});

	describe('getProgressTrack', () => {
		it('should return progress track by key', () => {
			const { org } = createOrganization();
			const trackId = Identifier.generate();
			const orgId = Identifier.generate();
			const track = new ProgressTrack(trackId, orgId, 'test-track', 50);
			org.progressTracks.set('test-track', track);
			expect(org.getProgressTrack('test-track')).toBe(track);
		});

		it('should return undefined for non-existent track', () => {
			const { org } = createOrganization();
			expect(org.getProgressTrack('non-existent')).toBeUndefined();
		});
	});
});


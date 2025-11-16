import { describe, it, expect } from 'vitest';
import { OfferSystem } from './OfferSystem';
import { Organization } from '../entities/Organization';
import { TaskArchetype } from '../entities/TaskArchetype';
import { TaskOffer } from '../entities/TaskOffer';
import { UnlockRule } from '../entities/UnlockRule';
import { Identifier } from '../valueObjects/Identifier';
import { Timestamp } from '../valueObjects/Timestamp';
import { Duration } from '../valueObjects/Duration';
import { createTestOrganization, createTestTaskArchetype, createTestProgressTrack, createTestGold } from '../../test-utils';
import type {
	TaskArchetypeId
} from '../valueObjects/Identifier';

describe('OfferSystem', () => {
	const createOrganization = (): Organization => {
		return createTestOrganization();
	};

	const createArchetype = (id?: TaskArchetypeId): TaskArchetype => {
		return createTestTaskArchetype({ id });
	};

	const system = new OfferSystem();

	describe('generateOffers', () => {
		it('should generate offers for unlocked archetypes', () => {
			const org = createOrganization();
			const archetypeId = Identifier.generate();
			const archetype = createArchetype(archetypeId);

			// Create unlock rule
			const track = createTestProgressTrack({
				ownerOrganizationId: org.id,
				trackKey: 'exploration',
				currentValue: 100
			});
			org.progressTracks.set('exploration', track);

			const rule = new UnlockRule('rule-1', 'exploration', 50, {
				newTaskArchetypes: [archetypeId]
			});

			const offers = system.generateOffers(org, [archetype], [rule], Timestamp.now());
			expect(offers.length).toBeGreaterThanOrEqual(1);
			expect(offers[0].taskArchetypeId).toBe(archetypeId);
		});

		it('should filter out locked archetypes', () => {
			const org = createOrganization();
			const archetypeId = Identifier.generate();
			const archetype = createArchetype(archetypeId);

			// No unlock rule, so archetype should be filtered out
			const offers = system.generateOffers(org, [archetype], [], Timestamp.now());
			expect(offers.length).toBe(0);
		});

		it('should filter by track thresholds', () => {
			const org = createOrganization();
			const archetypeId = Identifier.generate();
			const requiredTracks = new Map([['research', 50]]);
			const archetype = createTestTaskArchetype({
				id: archetypeId,
				entryCost: createTestGold(10),
				baseReward: createTestGold(50),
				requiredTrackThresholds: requiredTracks
			});

			// Create unlock rule
			const track1 = createTestProgressTrack({
				ownerOrganizationId: org.id,
				trackKey: 'exploration',
				currentValue: 100
			});
			org.progressTracks.set('exploration', track1);

			const rule = new UnlockRule('rule-1', 'exploration', 50, {
				newTaskArchetypes: [archetypeId]
			});

			// Track threshold not met
			const offers1 = system.generateOffers(org, [archetype], [rule], Timestamp.now());
			expect(offers1.length).toBe(0);

			// Add track that meets threshold
			const track2 = createTestProgressTrack({
				ownerOrganizationId: org.id,
				trackKey: 'research',
				currentValue: 100
			});
			org.progressTracks.set('research', track2);

			const offers2 = system.generateOffers(org, [archetype], [rule], Timestamp.now());
			expect(offers2.length).toBe(1);
		});
	});

	describe('expireOffers', () => {
		it('should filter out expired offers', () => {
			const org = createOrganization();
			const archetypeId = Identifier.generate();
			const now = Timestamp.now();
			const expiredAt = now.subtract(Duration.ofHours(1));
			const offerId = Identifier.generate();
			const offer = new TaskOffer(offerId, org.id, archetypeId, expiredAt, expiredAt);

			const filtered = system.expireOffers([offer], now);
			expect(filtered.length).toBe(0);
		});

		it('should keep non-expired offers', () => {
			const org = createOrganization();
			const archetypeId = Identifier.generate();
			const now = Timestamp.now();
			const expiresAt = now.add(Duration.ofHours(1));
			const offerId = Identifier.generate();
			const offer = new TaskOffer(offerId, org.id, archetypeId, now, expiresAt);

			const filtered = system.expireOffers([offer], now);
			expect(filtered.length).toBe(1);
		});
	});
});


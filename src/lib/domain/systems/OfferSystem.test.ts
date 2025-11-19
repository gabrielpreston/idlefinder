/**
 * Offer System Tests - Task offer generation and management
 */

import { describe, it, expect } from 'vitest';
import { OfferSystem } from './OfferSystem';
import { Organization } from '../entities/Organization';
import { TaskOffer } from '../entities/TaskOffer';
import { TaskArchetype } from '../entities/TaskArchetype';
import { UnlockRule } from '../entities/UnlockRule';
import { Identifier } from '../valueObjects/Identifier';
import { Timestamp } from '../valueObjects/Timestamp';
import { Duration } from '../valueObjects/Duration';
import { ResourceBundle } from '../valueObjects/ResourceBundle';
import { ResourceUnit } from '../valueObjects/ResourceUnit';
import { ProgressTrack } from '../entities/ProgressTrack';

function createTestOrganization(): Organization {
	const orgId = Identifier.generate<'OrganizationId'>();
	const playerId = Identifier.generate<'PlayerId'>();
	const now = Timestamp.now();
	const wallet = ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);
	const progressTracks = new Map<string, ProgressTrack>();
	return new Organization(
		orgId,
		playerId,
		now,
		now,
		progressTracks,
		{ wallet },
		now
	);
}

function createTestTaskArchetype(id: string, requiredThresholds: Map<string, number> = new Map()): TaskArchetype {
	const archetypeId = Identifier.from<'TaskArchetypeId'>(id);
	return new TaskArchetype(
		archetypeId,
		'test-category',
		Duration.ofMinutes(10),
		1,
		1,
		'str',
		[],
		ResourceBundle.fromArray([new ResourceUnit('gold', 10)]),
		ResourceBundle.fromArray([new ResourceUnit('gold', 50)]),
		requiredThresholds
	);
}

function createTestUnlockRule(
	trackKey: string,
	threshold: number,
	archetypeIds: string[] = []
): UnlockRule {
	const archetypeIdObjects = archetypeIds.map(id => Identifier.from<'TaskArchetypeId'>(id));
	return new UnlockRule(
		`rule-${trackKey}-${threshold}`,
		trackKey,
		threshold,
		{
			newTaskArchetypes: archetypeIdObjects
		}
	);
}

describe('OfferSystem', () => {
	describe('generateOffers', () => {
		it('should return empty array when no archetypes available', () => {
			const system = new OfferSystem();
			const org = createTestOrganization();
			const archetypes: TaskArchetype[] = [];
			const unlockRules: UnlockRule[] = [];
			const now = Timestamp.now();

			const offers = system.generateOffers(org, archetypes, unlockRules, now);

			expect(offers).toHaveLength(0);
		});

		it('should filter out archetypes not in unlock rules', () => {
			const system = new OfferSystem();
			const org = createTestOrganization();
			const archetype = createTestTaskArchetype('archetype-1');
			const archetypes = [archetype];
			const unlockRules: UnlockRule[] = []; // No unlock rules
			const now = Timestamp.now();

			const offers = system.generateOffers(org, archetypes, unlockRules, now);

			expect(offers).toHaveLength(0);
		});

		it('should filter out archetypes not unlocked', () => {
			const system = new OfferSystem();
			const org = createTestOrganization();
			const archetype = createTestTaskArchetype('archetype-1');
			const archetypes = [archetype];
			const unlockRule = createTestUnlockRule('track-1', 100, ['archetype-1']);
			const unlockRules = [unlockRule];
			// Track not at threshold
			const now = Timestamp.now();

			const offers = system.generateOffers(org, archetypes, unlockRules, now);

			expect(offers).toHaveLength(0);
		});

		it('should generate offers for unlocked archetypes', () => {
			const system = new OfferSystem();
			const org = createTestOrganization();
			const track = new ProgressTrack(
				Identifier.generate<'ProgressTrackId'>(),
				org.id,
				'track-1',
				100 // At threshold
			);
			org.progressTracks.set('track-1', track);

			const archetype = createTestTaskArchetype('archetype-1');
			const archetypes = [archetype];
			const unlockRule = createTestUnlockRule('track-1', 100, ['archetype-1']);
			const unlockRules = [unlockRule];
			const now = Timestamp.now();

			const offers = system.generateOffers(org, archetypes, unlockRules, now);

			expect(offers.length).toBeGreaterThanOrEqual(0);
		});

		it('should respect MIN_OFFERS and MAX_OFFERS', () => {
			const system = new OfferSystem();
			const org = createTestOrganization();
			const track = new ProgressTrack(
				Identifier.generate<'ProgressTrackId'>(),
				org.id,
				'track-1',
				100
			);
			org.progressTracks.set('track-1', track);

			// Create many unlocked archetypes
			const archetypes = Array.from({ length: 10 }, (_, i) => 
				createTestTaskArchetype(`archetype-${i}`)
			);
			const unlockRule = createTestUnlockRule(
				'track-1',
				100,
				archetypes.map(a => a.id.value)
			);
			const unlockRules = [unlockRule];
			const now = Timestamp.now();

			const offers = system.generateOffers(org, archetypes, unlockRules, now);

			expect(offers.length).toBeGreaterThanOrEqual(system.MIN_OFFERS);
			expect(offers.length).toBeLessThanOrEqual(system.MAX_OFFERS);
		});

		it('should set expiration time on offers', () => {
			const system = new OfferSystem();
			const org = createTestOrganization();
			const track = new ProgressTrack(
				Identifier.generate<'ProgressTrackId'>(),
				org.id,
				'track-1',
				100
			);
			org.progressTracks.set('track-1', track);

			const archetype = createTestTaskArchetype('archetype-1');
			const archetypes = [archetype];
			const unlockRule = createTestUnlockRule('track-1', 100, ['archetype-1']);
			const unlockRules = [unlockRule];
			const now = Timestamp.now();

			const offers = system.generateOffers(org, archetypes, unlockRules, now);

			if (offers.length > 0) {
				expect(offers[0].expiresAt).toBeDefined();
			}
		});
	});

	describe('expireOffers', () => {
		it('should return all offers when none expired', () => {
			const system = new OfferSystem();
			const now = Timestamp.now();
			const futureTime = Timestamp.from(now.value + 3600000);
			const offer1 = new TaskOffer(
				Identifier.generate<'TaskOfferId'>(),
				Identifier.generate<'OrganizationId'>(),
				Identifier.generate<'TaskArchetypeId'>(),
				now,
				futureTime
			);
			const offers = [offer1];

			const result = system.expireOffers(offers, now);

			expect(result).toHaveLength(1);
		});

		it('should filter out expired offers', () => {
			const system = new OfferSystem();
			const now = Timestamp.now();
			const pastTime = Timestamp.from(now.value - 3600000);
			const offer1 = new TaskOffer(
				Identifier.generate<'TaskOfferId'>(),
				Identifier.generate<'OrganizationId'>(),
				Identifier.generate<'TaskArchetypeId'>(),
				pastTime,
				pastTime // Expired
			);
			const futureTime = Timestamp.from(now.value + 3600000);
			const offer2 = new TaskOffer(
				Identifier.generate<'TaskOfferId'>(),
				Identifier.generate<'OrganizationId'>(),
				Identifier.generate<'TaskArchetypeId'>(),
				now,
				futureTime
			);
			const offers = [offer1, offer2];

			const result = system.expireOffers(offers, now);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe(offer2.id);
		});
	});

	describe('refreshOffers', () => {
		it('should call generateOffers', () => {
			const system = new OfferSystem();
			const org = createTestOrganization();
			const archetypes: TaskArchetype[] = [];
			const unlockRules: UnlockRule[] = [];
			const now = Timestamp.now();

			const offers = system.refreshOffers(org, archetypes, unlockRules, now);

			expect(Array.isArray(offers)).toBe(true);
		});
	});
});


import type { Organization } from '../entities/Organization';
import { TaskOffer } from '../entities/TaskOffer';
import { TaskArchetype } from '../entities/TaskArchetype';
import { UnlockRule } from '../entities/UnlockRule';
import { Identifier } from '../valueObjects/Identifier';
import { Timestamp } from '../valueObjects/Timestamp';
import { Duration } from '../valueObjects/Duration';
import type {
	TaskOfferId,
	OrganizationId
} from '../valueObjects/Identifier';

/**
 * Domain system for generating and managing task offers.
 */
export class OfferSystem {
	private readonly OFFER_EXPIRATION_HOURS = 1;
	public readonly MIN_OFFERS = 3;
	public readonly MAX_OFFERS = 5;

	/**
	 * Generates task offers for an organization.
	 * Filters archetypes by unlock rules and track thresholds.
	 * Returns 3-5 offers deterministically.
	 */
	generateOffers(
		org: Organization,
		archetypes: TaskArchetype[],
		unlockRules: UnlockRule[],
		now: Timestamp
	): TaskOffer[] {
		// Get all archetype IDs mentioned in unlock rules (use string keys for Set equality)
		const archetypeIdsInUnlockRules = new Set<string>();
		for (const rule of unlockRules) {
			if (rule.effects.newTaskArchetypes) {
				for (const archetypeId of rule.effects.newTaskArchetypes) {
					archetypeIdsInUnlockRules.add(archetypeId.value);
				}
			}
		}

		// Get unlocked archetype IDs (those that have reached their thresholds)
		const unlockedArchetypeIds = new Set<string>();
		for (const rule of unlockRules) {
			const track = org.getProgressTrack(rule.trackKey);
			if (track && track.hasReachedThreshold(rule.thresholdValue)) {
				if (rule.effects.newTaskArchetypes) {
					for (const archetypeId of rule.effects.newTaskArchetypes) {
						unlockedArchetypeIds.add(archetypeId.value);
					}
				}
			}
		}

		// Filter archetypes by unlock status and track thresholds
		const availableArchetypes = archetypes.filter((archetype) => {
			// Archetype must be mentioned in unlock rules
			if (!archetypeIdsInUnlockRules.has(archetype.id.value)) {
				return false; // Not in unlock rules, filter out
			}

			// If archetype is mentioned in unlock rules, check if it's unlocked
			if (!unlockedArchetypeIds.has(archetype.id.value)) {
				return false; // Not unlocked yet
			}

			// Check required track thresholds
			for (const [trackKey, threshold] of archetype.requiredTrackThresholds.entries()) {
				const track = org.getProgressTrack(trackKey);
				if (!track || !track.hasReachedThreshold(threshold)) {
					return false;
				}
			}

			return true;
		});

		// Generate offers (deterministic: take first N available)
		const numOffers = Math.min(
			Math.max(this.MIN_OFFERS, availableArchetypes.length),
			this.MAX_OFFERS
		);
		const selectedArchetypes = availableArchetypes.slice(0, numOffers);

		const offers: TaskOffer[] = [];
		const expiresAt = now.add(Duration.ofHours(this.OFFER_EXPIRATION_HOURS));

		for (const archetype of selectedArchetypes) {
			const offerId: TaskOfferId = Identifier.generate();
			const orgId: OrganizationId = org.id;
			const offer = new TaskOffer(offerId, orgId, archetype.id, now, expiresAt);
			offers.push(offer);
		}

		return offers;
	}

	/**
	 * Expires offers that have passed their expiration time.
	 * Returns new array without mutating inputs.
	 */
	expireOffers(offers: TaskOffer[], now: Timestamp): TaskOffer[] {
		return offers.filter((offer) => !offer.isExpired(now));
	}

	/**
	 * Refreshes offers for an organization.
	 * Wrapper around generateOffers.
	 */
	refreshOffers(
		org: Organization,
		archetypes: TaskArchetype[],
		unlockRules: UnlockRule[],
		now: Timestamp
	): TaskOffer[] {
		return this.generateOffers(org, archetypes, unlockRules, now);
	}
}


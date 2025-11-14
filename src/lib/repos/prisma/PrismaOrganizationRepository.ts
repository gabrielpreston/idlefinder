import { PrismaClient } from '@prisma/client';
import type { OrganizationRepository } from '../contracts/OrganizationRepository';
import { Organization } from '$lib/domain/entities/Organization';
import { ProgressTrack } from '$lib/domain/entities/ProgressTrack';
import { Identifier } from '$lib/domain/valueObjects/Identifier';
import type {
	OrganizationId,
	PlayerId,
	ProgressTrackId
} from '$lib/domain/valueObjects/Identifier';
import {
	prismaDateTimeToTimestamp,
	timestampToPrismaDateTime,
	jsonToResourceBundle,
	resourceBundleToJson,
	stringToIdentifier
} from './mappers';

/**
 * Prisma implementation of OrganizationRepository.
 */
export class PrismaOrganizationRepository implements OrganizationRepository {
	constructor(private prisma: PrismaClient) {}

	async getById(id: OrganizationId): Promise<Organization | null> {
		const data = await this.prisma.organization.findUnique({
			where: { id: id.value },
			include: {
				progressTracks: true
			}
		});

		if (!data) {
			return null;
		}

		return this.toDomainEntity(data);
	}

	async save(org: Organization): Promise<void> {
		const data = this.toPrismaData(org);

		await this.prisma.organization.upsert({
			where: { id: org.id.value },
			create: {
				...data,
				progressTracks: {
					create: Array.from(org.progressTracks.values()).map((track) => ({
						id: track.id.value,
						trackKey: track.trackKey,
						currentValue: track.currentValue
					}))
				}
			},
			update: {
				ownerPlayerId: data.ownerPlayerId,
				lastActiveAt: data.lastActiveAt,
				lastSimulatedAt: data.lastSimulatedAt,
				walletData: data.walletData,
				progressTracks: {
					upsert: Array.from(org.progressTracks.values()).map((track) => ({
						where: {
							organizationId_trackKey: {
								organizationId: org.id.value,
								trackKey: track.trackKey
							}
						},
						create: {
							id: track.id.value,
							trackKey: track.trackKey,
							currentValue: track.currentValue
						},
						update: {
							currentValue: track.currentValue
						}
					}))
				}
			}
		});
	}

	async findByOwner(ownerPlayerId: PlayerId): Promise<Organization | null> {
		const data = await this.prisma.organization.findFirst({
			where: { ownerPlayerId: ownerPlayerId.value },
			include: {
				progressTracks: true
			}
		});

		if (!data) {
			return null;
		}

		return this.toDomainEntity(data);
	}

	private toDomainEntity(data: {
		id: string;
		ownerPlayerId: string;
		createdAt: Date;
		lastActiveAt: Date;
		lastSimulatedAt: Date;
		walletData: string;
		progressTracks: Array<{
			id: string;
			trackKey: string;
			currentValue: number;
		}>;
	}): Organization {
		const orgId: OrganizationId = stringToIdentifier(data.id);
		const playerId: PlayerId = stringToIdentifier(data.ownerPlayerId);
		const createdAt = prismaDateTimeToTimestamp(data.createdAt);
		const lastActiveAt = prismaDateTimeToTimestamp(data.lastActiveAt);
		const lastSimulatedAt = prismaDateTimeToTimestamp(data.lastSimulatedAt);
		const wallet = jsonToResourceBundle(data.walletData);

		const progressTracks = new Map<string, ProgressTrack>();
		for (const trackData of data.progressTracks) {
			const trackId: ProgressTrackId = Identifier.from(trackData.id);
			const track = new ProgressTrack(
				trackId,
				orgId,
				trackData.trackKey,
				trackData.currentValue
			);
			progressTracks.set(trackData.trackKey, track);
		}

		return new Organization(
			orgId,
			playerId,
			createdAt,
			lastActiveAt,
			progressTracks,
			{ wallet },
			lastSimulatedAt
		);
	}

	private toPrismaData(org: Organization): {
		id: string;
		ownerPlayerId: string;
		createdAt: Date;
		lastActiveAt: Date;
		lastSimulatedAt: Date;
		walletData: string;
	} {
		return {
			id: org.id.value,
			ownerPlayerId: org.ownerPlayerId.value,
			createdAt: timestampToPrismaDateTime(org.createdAt),
			lastActiveAt: timestampToPrismaDateTime(org.lastActiveAt),
			lastSimulatedAt: timestampToPrismaDateTime(org.lastSimulatedAt),
			walletData: resourceBundleToJson(org.economyState.wallet)
		};
	}
}


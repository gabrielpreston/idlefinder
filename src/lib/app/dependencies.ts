import { PrismaClient } from '@prisma/client';
import {
	PrismaOrganizationRepository,
	PrismaAgentRepository,
	PrismaTaskRepository,
	PrismaFacilityRepository,
	PrismaConfigRepository
} from '$lib/repos/prisma';
import {
	EconomySystem,
	TaskResolutionSystem,
	RosterSystem,
	OfferSystem,
	ProgressionSystem
} from '$lib/domain/systems';
import {
	StartTaskService,
	AdvanceWorldService,
	RecruitAgentService,
	UpgradeFacilityService
} from '$lib/app';

// Singleton PrismaClient instance (reused across requests)
const prisma = new PrismaClient();

/**
 * Creates and wires up all dependencies for application services.
 * Uses singleton PrismaClient to ensure single database connection.
 */
export function createDependencies() {
	// Wire up repositories (using singleton prisma)
	const organizationRepo = new PrismaOrganizationRepository(prisma);
	const agentRepo = new PrismaAgentRepository(prisma);
	const taskRepo = new PrismaTaskRepository(prisma);
	const facilityRepo = new PrismaFacilityRepository(prisma);
	const configRepo = new PrismaConfigRepository(prisma);

	// Wire up systems
	const economySystem = new EconomySystem();
	const taskResolutionSystem = new TaskResolutionSystem();
	const rosterSystem = new RosterSystem();
	const offerSystem = new OfferSystem();
	const progressionSystem = new ProgressionSystem();

	// Wire up services
	const startTaskService = new StartTaskService(
		organizationRepo,
		taskRepo,
		agentRepo,
		economySystem
	);

	const advanceWorldService = new AdvanceWorldService(
		organizationRepo,
		taskRepo,
		agentRepo,
		facilityRepo,
		configRepo,
		taskResolutionSystem,
		rosterSystem,
		offerSystem,
		progressionSystem,
		economySystem
	);

	const recruitAgentService = new RecruitAgentService(
		organizationRepo,
		agentRepo,
		economySystem
	);

	const upgradeFacilityService = new UpgradeFacilityService(
		organizationRepo,
		facilityRepo,
		economySystem,
		progressionSystem
	);

	return {
		startTaskService,
		advanceWorldService,
		recruitAgentService,
		upgradeFacilityService,
		organizationRepo,
		agentRepo,
		taskRepo,
		facilityRepo,
		configRepo
	};
}

/**
 * Gets the singleton PrismaClient instance.
 * Use for direct database access if needed.
 */
export function getPrisma(): PrismaClient {
	return prisma;
}


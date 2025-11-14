import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { createDependencies } from '$lib/app/dependencies';
import { taskInstanceToDTO } from '$lib/app/dtoMappers';
import { Identifier } from '$lib/domain/valueObjects/Identifier';
import { Timestamp } from '$lib/domain/valueObjects/Timestamp';
import type { OrganizationId, TaskInstanceId } from '$lib/domain/valueObjects/Identifier';

/**
 * Individual task endpoint - returns a single task instance by ID.
 */
export const GET: RequestHandler = async ({ params, url }) => {
	const { taskId: taskIdParam } = params;
	const organizationIdParam = url.searchParams.get('organizationId');

	if (!taskIdParam) {
		throw error(400, { message: 'taskId parameter is required' });
	}

	if (!organizationIdParam) {
		throw error(400, { message: 'organizationId query parameter is required' });
	}

	const { taskRepo } = createDependencies();
	const organizationId: OrganizationId = Identifier.from(organizationIdParam);
	const taskId: TaskInstanceId = Identifier.from(taskIdParam);

	// Get task instance
	const task = await taskRepo.getInstanceById(taskId);
	if (!task) {
		throw error(404, { message: 'Task not found' });
	}

	// Validate task belongs to organization
	if (!task.organizationId.equals(organizationId)) {
		throw error(404, { message: 'Task not found' });
	}

	// Load archetype for DTO conversion
	const allArchetypes = await taskRepo.getAllArchetypes();
	const archetypesMap = new Map(allArchetypes.map((a) => [a.id.value, a]));
	const archetype = archetypesMap.get(task.taskArchetypeId.value);

	if (!archetype) {
		throw error(500, { message: 'Task archetype not found' });
	}

	// Convert to DTO
	const now = Timestamp.now();
	const taskDTO = taskInstanceToDTO(task, archetype, now);

	return json(taskDTO);
};


/**
 * DTO for task instance.
 * Flattens domain entities for client consumption.
 */
export interface TaskInstanceDTO {
	id: string;
	taskArchetypeId: string;
	category: string;
	assignedAgentIds: string[];
	startedAt: number;
	expectedCompletionAt: number;
	status: string;
	progress: number; // computed: (now - startedAt) / (expectedCompletionAt - startedAt)
}


/**
 * DTO for agent instance.
 * Flattens domain entities for client consumption.
 */
export interface AgentDTO {
	id: string;
	templateId: string;
	level: number;
	experience: number;
	stats: Record<string, number>; // NumericStatMap as object
	status: string;
	currentTaskId?: string;
}


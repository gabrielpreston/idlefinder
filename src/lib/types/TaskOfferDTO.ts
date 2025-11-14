/**
 * DTO for task offer.
 * Flattens domain entities for client consumption.
 */
export interface TaskOfferDTO {
	id: string;
	taskArchetypeId: string;
	category: string;
	minAgents: number;
	maxAgents: number;
	entryCost: Record<string, number>; // ResourceBundle as object
	baseReward: Record<string, number>; // ResourceBundle as object
	expiresAt?: number;
}


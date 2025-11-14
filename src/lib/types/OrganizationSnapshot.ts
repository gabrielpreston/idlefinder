/**
 * DTO for organization snapshot.
 * Flattens domain entities for client consumption.
 */
export interface OrganizationSnapshot {
	id: string;
	wallet: Record<string, number>; // ResourceBundle as object
	progressTracks: Record<string, number>; // trackKey -> value
	lastSimulatedAt: number;
}


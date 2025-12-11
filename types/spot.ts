export interface Spot {
	id: string;
	name: string;
	description?: string;
	valid: boolean;
	weight?: number;
	latitude?: number;
	longitude?: number;
	scenarioId: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface CreateSpotDTO {
	name: string;
	description?: string;
	valid?: boolean;
	weight?: number;
	latitude?: number;
	longitude?: number;
	scenarioId: string;
}

export interface UpdateSpotDTO extends Partial<CreateSpotDTO> {
	spotId: string;
}

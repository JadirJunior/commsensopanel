export interface Measurement {
	id: string;
	value: number;
	dtMeasure: string;
	sensorId: string;
	deviceScenarioId: string;
	Sensor?: {
		id: string;
		categoryId: string;
		Category?: {
			id: string;
			name: string;
			unit: string;
		};
	};
	DeviceScenario?: {
		id: string;
		name?: string;
		macAddress: string;
	};
}

export interface FilterMeasurementsDTO {
	dtStart?: string;
	dtEnd?: string;
	period?: "1h" | "6h" | "12h" | "24h" | "7d" | "30d";
	page?: number;
	limit?: number;
	orderBy: {
		field: string;
		direction: "asc" | "desc";
	};
	deviceIds?: string[];
	sensorIds?: string[];
}

export interface MeasurementsResponse {
	measurements: Measurement[];
	total: number;
}

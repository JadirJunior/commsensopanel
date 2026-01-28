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

export interface SensorStatistics {
	min: number;
	max: number;
	avg: number;
	total: number;
}

// Estrutura: { deviceId: { sensorId: stats } }
export type DeviceStatistics = Record<string, Record<string, SensorStatistics>>;

export interface MeasurementsResponse {
	measurements: Measurement[];
	total: number;
	statistics: DeviceStatistics;
}

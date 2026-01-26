export interface DeviceBoilerplate {
	id: string;
	name: string;
	enabled: boolean;
	sensors?: Sensor[];
}

export interface Sensor {
	id: string;
	categoryId: string;
	deviceId: string;
	Category?: SensorCategory;
}

export interface SensorCategory {
	id: string;
	name: string;
	unit: string;
}

export interface DeviceScenario {
	id: string;
	name?: string;
	macAddress: string;
	mqttClientId: string;
	status: "provisioned" | "active" | "blocked";
	activatedAt: string | null;
	blockedAt: string | null;
	claimCode: string;
	deviceId: string;
	spotId: string;
	scenarioId: string;
	tenantId: string;
	Device?: DeviceBoilerplate;
	Spot?: {
		id: string;
		name: string;
	};
}

export interface CreateDeviceScenarioDTO {
	boilerplateId: string;
	name?: string;
	spotId?: string;
	macAddress: string;
}

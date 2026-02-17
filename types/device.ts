export interface DeviceBoilerplate {
	id: string;
	name: string;
	enabled: boolean;
	canActAsGateway: boolean;
	protocols: string[];
	sensors?: Sensor[];
}

export interface Sensor {
	id: string;
	categoryId: string;
	deviceId: string;
	channel?: number;
	Category?: SensorCategory;
}

export interface SensorCategory {
	id: string;
	key?: string;
	name: string;
	unit: string;
}

export interface DeviceScenario {
	id: string;
	name?: string;
	macAddress: string;
	mqttClientId: string;
	role: "gateway" | "node" | "self";
	nodeId?: string | null;
	deviceParentId?: string | null;
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
	DeviceParent?: {
		id: string;
		name?: string;
		macAddress: string;
		Device?: {
			name: string;
		};
	};
	deviceStates?: DeviceState[];
}

export interface CreateDeviceScenarioDTO {
	boilerplateId: string;
	name?: string;
	spotId?: string;
	macAddress: string;
	role?: "gateway" | "node" | "self";
}

export type DeviceStatus =
	| "ONLINE"
	| "OFFLINE"
	| "MEASURING"
	| "ERROR"
	| "MAINTENANCE";

export interface DeviceState {
	id: string;
	deviceScenarioId: string;
	status: DeviceStatus;
	metadata: Record<string, any> | null;
	dtState: string;
	createdAt: string;
}

export interface DeviceStateWithDetails {
	deviceScenario: {
		id: string;
		name?: string;
		mqttClientId: string;
		role: "gateway" | "node" | "self";
	};
	gateway: {
		id: string;
		name?: string;
		mqttClientId: string;
	} | null;
	currentState: DeviceState;
}

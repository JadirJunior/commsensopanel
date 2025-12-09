/**
 * Constantes de permissões para facilitar o uso no código
 * Evita erros de digitação e fornece autocomplete
 */

// === TENANT PERMISSIONS ===
export const TENANT_PERMISSIONS = {
	// Cenários
	SCENARIO_VIEW: "tenant:scenario-view",
	SCENARIO_EDIT: "tenant:scenario-edit",
	SCENARIO_ALL: "tenant:scenario-all",

	// Usuários
	USER_VIEW: "tenant:user-view",
	USER_EDIT: "tenant:user-edit",
	USER_ALL: "tenant:user-all",

	// Roles
	ROLE_VIEW: "tenant:role-view",
	ROLE_EDIT: "tenant:role-edit",
	ROLE_ALL: "tenant:role-all",
} as const;

// === SCENARIO PERMISSIONS ===
export const SCENARIO_PERMISSIONS = {
	// Dispositivos
	DEVICE_VIEW: "scenario:device-view",
	DEVICE_EDIT: "scenario:device-edit",
	DEVICE_ALL: "scenario:device-all",

	// Regras de Sensor
	SENSOR_RULE_VIEW: "scenario:sensor_rule-view",
	SENSOR_RULE_EDIT: "scenario:sensor_rule-edit",
	SENSOR_RULE_ALL: "scenario:sensor_rule-all",

	// Spots
	SPOT_VIEW: "scenario:spot-view",
	SPOT_EDIT: "scenario:spot-edit",
	SPOT_ALL: "scenario:spot-all",

	// Medições
	MEASUREMENT_VIEW: "scenario:measurement-view",
	MEASUREMENT_EDIT: "scenario:measurement-edit",
	MEASUREMENT_ALL: "scenario:measurement-all",

	// Geração de Imagem
	IMAGE_GENERATION_VIEW: "scenario:image_generation-view",
	IMAGE_GENERATION_EDIT: "scenario:image_generation-edit",
	IMAGE_GENERATION_ALL: "scenario:image_generation-all",

	// Usuários do Cenário
	USER_VIEW: "scenario:user-view",
	USER_EDIT: "scenario:user-edit",
	USER_ALL: "scenario:user-all",

	// Roles do Cenário
	ROLE_VIEW: "scenario:role-view",
	ROLE_EDIT: "scenario:role-edit",
	ROLE_ALL: "scenario:role-all",
} as const;

// === SYSTEM PERMISSIONS ===
export const SYSTEM_PERMISSIONS = {
	ADMIN_VIEW: "system:admin-view",
	ADMIN_EDIT: "system:admin-edit",
	ADMIN_ALL: "system:admin-all",
} as const;

// === ALL PERMISSIONS ===
export const PERMISSIONS = {
	...TENANT_PERMISSIONS,
	...SCENARIO_PERMISSIONS,
	...SYSTEM_PERMISSIONS,
} as const;

// Tipo para todas as permissões
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

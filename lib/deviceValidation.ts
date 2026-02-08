import { DeviceBoilerplate } from "@/types/device";

export type DeviceRole = "gateway" | "node" | "self";

export interface RoleValidationResult {
	valid: boolean;
	reason?: string;
}

/**
 * Validates if a device can be assigned a specific role
 */
export function canAssignRole(
	device: DeviceBoilerplate | null,
	role: DeviceRole,
): RoleValidationResult {
	if (!device) {
		return {
			valid: false,
			reason: "Nenhum dispositivo selecionado",
		};
	}

	if (role === "gateway" && !device.canActAsGateway) {
		return {
			valid: false,
			reason: "Este dispositivo não possui capacidade de atuar como gateway",
		};
	}

	return { valid: true };
}

/**
 * Validates if a device can change from one role to another
 * Gateway role cannot be changed once assigned
 */
export function canChangeRole(
	currentRole: DeviceRole,
	newRole: DeviceRole,
	device: DeviceBoilerplate | null,
): RoleValidationResult {
	// Gateway cannot be changed
	if (currentRole === "gateway" && newRole !== "gateway") {
		return {
			valid: false,
			reason:
				"Dispositivos configurados como gateway não podem ter sua função alterada",
		};
	}

	// Node and Self can be switched between each other
	if (
		(currentRole === "node" || currentRole === "self") &&
		newRole !== "gateway"
	) {
		return { valid: true };
	}

	// Changing to gateway requires capability check
	if (newRole === "gateway") {
		return canAssignRole(device, "gateway");
	}

	return { valid: true };
}

/**
 * Gets a human-readable description for a device role
 */
export function getRoleDescription(role: DeviceRole): string {
	const descriptions: Record<DeviceRole, string> = {
		gateway: "Coordena e gerencia outros dispositivos na rede",
		node: "Conecta-se através de um gateway para comunicação",
		self: "Opera de forma independente, sem dependências",
	};

	return descriptions[role];
}

/**
 * Gets a human-readable label for a device role
 */
export function getRoleLabel(role: DeviceRole): string {
	const labels: Record<DeviceRole, string> = {
		gateway: "Gateway",
		node: "Nó (Node)",
		self: "Independente (Self)",
	};

	return labels[role];
}

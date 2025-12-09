// Tipos de permissão baseados no backend
export type ResourceScope = "tenant" | "scenario" | "system";
export type Action = "none" | "view" | "edit" | "all";

// Recursos por escopo (espelha o backend)
export const permissionsByScope: Record<ResourceScope, string[]> = {
	tenant: ["scenario", "user", "role"],
	scenario: [
		"device",
		"sensor_rule",
		"spot",
		"measurement",
		"image_generation",
		"user",
		"role",
	],
	system: ["admin"],
};

// Hierarquia de ações (quem tem "all" pode fazer "edit", "view", etc)
export const actionsHierarchy: Record<Action, Action[]> = {
	none: [],
	view: ["none"],
	edit: ["view", "none"],
	all: ["edit", "view", "none"],
};

export interface ParsedPermission {
	scope: ResourceScope;
	resource: string;
	action: Action;
}

/**
 * Faz o parse de "tenant:user-edit" -> { scope, resource, action }
 */
export function parsePermission(permission: string): ParsedPermission | null {
	const [data, actionRaw] = permission.split("-");
	if (!data || !actionRaw) return null;

	const [scopeRaw, resource] = data.split(":");
	if (!scopeRaw || !resource) return null;

	const scope = scopeRaw as ResourceScope;
	const action = actionRaw as Action;

	if (!permissionsByScope[scope]?.includes(resource)) return null;
	if (!(action in actionsHierarchy)) return null;

	return { scope, resource, action };
}

/**
 * Verifica se uma permissão concedida cobre a requerida
 * Ex:
 *   granted:  tenant:user-all
 *   required: tenant:user-view  -> true (all inclui view)
 *
 *   granted:  tenant:user-view
 *   required: tenant:user-edit  -> false (view não inclui edit)
 */
export function checkPermissionHierarchy(
	granted: string,
	required: string
): boolean {
	if (granted === required) return true;

	const grantedParsed = parsePermission(granted);
	const requiredParsed = parsePermission(required);

	if (!grantedParsed || !requiredParsed) return false;

	// Tem que ser o MESMO recurso no MESMO escopo
	if (
		grantedParsed.scope !== requiredParsed.scope ||
		grantedParsed.resource !== requiredParsed.resource
	) {
		return false;
	}

	const higherLevels = actionsHierarchy[grantedParsed.action];
	if (!higherLevels) return false;

	return higherLevels.includes(requiredParsed.action);
}

/**
 * Verifica se o usuário tem a permissão requerida
 * Considera a hierarquia de ações
 */
export function hasPermission(
	userPermissions: string[],
	requiredPermission: string
): boolean {
	return userPermissions.some((granted) =>
		checkPermissionHierarchy(granted, requiredPermission)
	);
}

/**
 * Verifica se o usuário tem TODAS as permissões requeridas
 */
export function hasAllPermissions(
	userPermissions: string[],
	requiredPermissions: string[]
): boolean {
	return requiredPermissions.every((required) =>
		hasPermission(userPermissions, required)
	);
}

/**
 * Verifica se o usuário tem PELO MENOS UMA das permissões requeridas
 */
export function hasAnyPermission(
	userPermissions: string[],
	requiredPermissions: string[]
): boolean {
	return requiredPermissions.some((required) =>
		hasPermission(userPermissions, required)
	);
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatPermission(permission: string): string {
	// Formato esperado: scope:resource-action (ex: tenant:scenario-edit)
	const parts = permission.split(":");
	if (parts.length < 2) return permission;

	// Pega a parte resource-action
	const resourceAction = parts[1];
	const [resource, action] = resourceAction.split("-");

	if (!resource || !action) return permission;

	// Capitaliza primeira letra
	const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

	// Mapeamento de traduções comuns
	const translations: Record<string, string> = {
		user: "Usuários",
		role: "Cargos",
		scenario: "Cenários",
		view: "Visualizar",
		edit: "Editar",
		all: "Total",
		none: "Nenhum",
		create: "Criar",
		delete: "Excluir",
	};

	const translatedResource = translations[resource] || capitalize(resource);
	const translatedAction = translations[action] || capitalize(action);

	return `${translatedResource}: ${translatedAction}`;
}

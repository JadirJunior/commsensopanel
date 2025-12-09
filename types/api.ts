import { UserTenant } from "./auth";

// Padrão de resposta do backend CommSensoRest
export interface ApiResponse<T = unknown> {
	message?: string;
	data?: T;
	total?: number;
	status?: number;
	success?: boolean;
}

// Resposta específica de login do backend
export interface LoginResponseData {
	id: string;
	username: string;
	email: string;
	accessToken: string;
	refreshToken: string;
	systemAdmin?: boolean;
	userTenants?: UserTenant[];
}

// Resposta específica de usuário
export interface UserResponseData {
	id: string;
	email: string;
	username: string;
	name?: string;
	tenantId?: string;
	systemAdmin?: boolean;
	userTenants?: UserTenant[];
}

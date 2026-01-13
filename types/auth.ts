export interface RoleModel {
	id: string;
	name: string;
	description: string;
	permissions: string[];
	resources?: string[];
}

export interface Scenario {
	id: string;
	name: string;
	slug: string;
	tenantId: string;
}

export interface UserScenario {
	id: string;
	Scenario: Scenario;
	ScenarioRole: RoleModel;
}

export interface Tenant {
	id: string;
	name: string;
	slug: string;
	description?: string;
}

export interface UserTenant {
	id: string;
	userId: string;
	tenantId: string;
	tenantRoleId: string;
	Tenant: Tenant;
	TenantRole: RoleModel;
	UserScenarios: UserScenario[];
}

// Tipo para listagem de membros do tenant (retornado pela API)
export interface TenantMember {
	id: string; // userTenantId
	tenantId: string;
	tenantRoleId: string;
	TenantRole: {
		id: string;
		name: string;
	};
	UserScenarios: {
		ScenarioRole: {
			id: string;
			name: string;
		};
	}[];
	user: {
		id: string;
		username: string;
		email: string;
	};
}

export interface User {
	id?: string;
	email: string;
	username: string;
	name?: string;
	tenantId?: string;
	systemAdmin?: boolean;
	userTenants?: UserTenant[];
}

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface AuthResponse {
	user: User;
	accessToken: string;
	refreshToken: string;
}

export interface AuthContextType {
	user: User | null;
	accessToken: string | null;
	login: (credentials: LoginCredentials) => Promise<void>;
	logout: () => void;
	refreshUser: () => Promise<void>;
	isAuthenticated: boolean;
	isLoading: boolean;
}

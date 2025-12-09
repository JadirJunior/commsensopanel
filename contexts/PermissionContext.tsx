"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useAuth } from "./AuthContext";
import {
	hasPermission,
	hasAllPermissions,
	hasAnyPermission,
} from "@/types/permissions";

interface PermissionContextType {
	permissions: string[];
	can: (permission: string) => boolean;
	canAll: (permissions: string[]) => boolean;
	canAny: (permissions: string[]) => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(
	undefined
);

export function PermissionProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const { user } = useAuth();

	// Extrai as permissões do usuário (pode vir de userTenants, userScenarios, etc)
	const permissions = useMemo(() => {
		if (!user) return [];

		const allPermissions: string[] = [];

		// Tipo auxiliar para acessar propriedades dinâmicas
		const userData = user as unknown as Record<string, unknown>;

		// Se tiver permissões diretas no usuário
		if (Array.isArray(userData.permissions)) {
			allPermissions.push(...(userData.permissions as string[]));
		}

		// Se tiver userTenants com roles e permissions
		if (Array.isArray(user.userTenants)) {
			for (const userTenant of user.userTenants as Array<{
				role?: { permissions?: string[] };
			}>) {
				if (Array.isArray(userTenant?.role?.permissions)) {
					allPermissions.push(...userTenant.role.permissions);
				}
			}
		}

		// Remove duplicatas
		return [...new Set(allPermissions)];
	}, [user]);

	const can = (permission: string) => hasPermission(permissions, permission);
	const canAll = (perms: string[]) => hasAllPermissions(permissions, perms);
	const canAny = (perms: string[]) => hasAnyPermission(permissions, perms);

	const value: PermissionContextType = {
		permissions,
		can,
		canAll,
		canAny,
	};

	return (
		<PermissionContext.Provider value={value}>
			{children}
		</PermissionContext.Provider>
	);
}

export function usePermissions() {
	const context = useContext(PermissionContext);
	if (context === undefined) {
		throw new Error(
			"usePermissions deve ser usado dentro de um PermissionProvider"
		);
	}
	return context;
}

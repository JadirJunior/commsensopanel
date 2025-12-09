"use client";

import { ReactNode, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
	hasPermission,
	hasAllPermissions,
	hasAnyPermission,
} from "@/types/permissions";

interface BaseVerifyPermissionsProps {
	/** Conteúdo a ser exibido se o usuário tiver permissão */
	children: ReactNode;
	/** Conteúdo alternativo se não tiver permissão (opcional) */
	fallback?: ReactNode;
	/** Modo de verificação: "all" = todas as permissões, "any" = pelo menos uma */
	mode?: "all" | "any";
}

interface TenantScopeProps extends BaseVerifyPermissionsProps {
	/** Escopo da permissão */
	scope: "tenant";
	/** ID do tenant para buscar as permissões do role correto */
	tenantId: string;
	/** Permissão ou lista de permissões requeridas */
	permissions: string | string[];
}

interface ScenarioScopeProps extends BaseVerifyPermissionsProps {
	scope: "scenario";
	tenantId: string;
	scenarioId: string;
	permissions: string | string[];
}

type VerifyPermissionsProps = TenantScopeProps | ScenarioScopeProps;

export function VerifyPermissions(props: VerifyPermissionsProps) {
	const { user } = useAuth();
	const {
		children,
		fallback = null,
		mode = "all",
		scope,
		tenantId,
		permissions,
	} = props;

	const permissionList = useMemo(
		() => (Array.isArray(permissions) ? permissions : [permissions]),
		[permissions]
	);

	const userPermissions = useMemo(() => {
		if (!user?.userTenants) return [];

		// Encontra o UserTenant correspondente ao tenantId
		const userTenant = user.userTenants.find((ut) => ut.tenantId === tenantId);
		if (!userTenant) return [];

		if (scope === "tenant") {
			// Retorna as permissões do TenantRole
			return userTenant.TenantRole?.permissions ?? [];
		}

		if (scope === "scenario") {
			const { scenarioId } = props as ScenarioScopeProps;
			// Encontra o UserScenario correspondente ao scenarioId
			const userScenario = userTenant.UserScenarios?.find(
				(us) => us.Scenario?.id === scenarioId
			);
			if (!userScenario) return [];

			// Retorna as permissões do ScenarioRole
			return userScenario.ScenarioRole?.permissions ?? [];
		}

		return [];
	}, [user, tenantId, scope, props]);

	const hasAccess = useMemo(() => {
		if (permissionList.length === 0) return true;
		if (userPermissions.length === 0) return false;

		if (mode === "any") {
			return hasAnyPermission(userPermissions, permissionList);
		}

		// mode === "all"
		return hasAllPermissions(userPermissions, permissionList);
	}, [userPermissions, permissionList, mode]);

	if (hasAccess) {
		return <>{children}</>;
	}

	return <>{fallback}</>;
}

export function useVerifyPermissions(
	options:
		| { scope: "tenant"; tenantId: string }
		| { scope: "scenario"; tenantId: string; scenarioId: string }
) {
	const { user } = useAuth();

	const userPermissions = useMemo(() => {
		if (!user?.userTenants) return [];

		const userTenant = user.userTenants.find(
			(ut) => ut.tenantId === options.tenantId
		);
		if (!userTenant) return [];

		if (options.scope === "tenant") {
			return userTenant.TenantRole?.permissions ?? [];
		}

		if (options.scope === "scenario") {
			const userScenario = userTenant.UserScenarios?.find(
				(us) => us.Scenario?.id === options.scenarioId
			);
			if (!userScenario) return [];
			return userScenario.ScenarioRole?.permissions ?? [];
		}

		return [];
	}, [user, options]);

	const can = (permission: string) =>
		hasPermission(userPermissions, permission);

	const canAll = (permissions: string[]) =>
		hasAllPermissions(userPermissions, permissions);

	const canAny = (permissions: string[]) =>
		hasAnyPermission(userPermissions, permissions);

	return {
		permissions: userPermissions,
		can,
		canAll,
		canAny,
	};
}

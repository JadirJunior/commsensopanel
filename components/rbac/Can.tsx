"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/contexts/PermissionContext";

interface CanProps {
	/** Permissão requerida (ex: "tenant:user-edit") */
	permission: string;
	/** Conteúdo a ser exibido se o usuário tiver permissão */
	children: ReactNode;
	/** Conteúdo alternativo se não tiver permissão (opcional) */
	fallback?: ReactNode;
}

/**
 * Componente que renderiza children apenas se o usuário tiver a permissão
 *
 * @example
 * <Can permission="tenant:user-edit">
 *   <Button>Editar Usuário</Button>
 * </Can>
 *
 * @example
 * <Can permission="tenant:user-view" fallback={<p>Sem acesso</p>}>
 *   <UserList />
 * </Can>
 */
export function Can({ permission, children, fallback = null }: CanProps) {
	const { can } = usePermissions();

	if (can(permission)) {
		return <>{children}</>;
	}

	return <>{fallback}</>;
}

interface CanAllProps {
	/** Lista de permissões requeridas (usuário precisa ter TODAS) */
	permissions: string[];
	children: ReactNode;
	fallback?: ReactNode;
}

/**
 * Componente que renderiza children apenas se o usuário tiver TODAS as permissões
 *
 * @example
 * <CanAll permissions={["tenant:user-edit", "tenant:role-view"]}>
 *   <AdminPanel />
 * </CanAll>
 */
export function CanAll({
	permissions,
	children,
	fallback = null,
}: CanAllProps) {
	const { canAll } = usePermissions();

	if (canAll(permissions)) {
		return <>{children}</>;
	}

	return <>{fallback}</>;
}

interface CanAnyProps {
	/** Lista de permissões (usuário precisa ter PELO MENOS UMA) */
	permissions: string[];
	children: ReactNode;
	fallback?: ReactNode;
}

/**
 * Componente que renderiza children se o usuário tiver PELO MENOS UMA das permissões
 *
 * @example
 * <CanAny permissions={["tenant:user-edit", "scenario:user-edit"]}>
 *   <UserActions />
 * </CanAny>
 */
export function CanAny({
	permissions,
	children,
	fallback = null,
}: CanAnyProps) {
	const { canAny } = usePermissions();

	if (canAny(permissions)) {
		return <>{children}</>;
	}

	return <>{fallback}</>;
}

interface CannotProps {
	/** Permissão que o usuário NÃO deve ter */
	permission: string;
	children: ReactNode;
}

/**
 * Componente que renderiza children apenas se o usuário NÃO tiver a permissão
 * Útil para mostrar mensagens de "acesso negado" ou conteúdo alternativo
 *
 * @example
 * <Cannot permission="tenant:user-view">
 *   <p>Você não tem acesso a esta área</p>
 * </Cannot>
 */
export function Cannot({ permission, children }: CannotProps) {
	const { can } = usePermissions();

	if (!can(permission)) {
		return <>{children}</>;
	}

	return null;
}

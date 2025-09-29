"use client";

import { useAuth } from "@/app/providers/auth-provider";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { LoadingPage } from "@/components/ui/loading-page";

export function ProtectedLayout({
	children,
	role,
}: {
	children: ReactNode;
	role?: string;
}) {
	const { token, user, loading } = useAuth();
	const router = useRouter();

	// Estado para segurar o loading artificial
	const [delayedLoading, setDelayedLoading] = useState(true);

	useEffect(() => {
		// Mesmo que o useAuth termine rápido, segura mais tempo no loading
		const timeout = setTimeout(() => {
			setDelayedLoading(false);
		}, 5000); // 2 segundos extra, ajuste como quiser

		return () => clearTimeout(timeout);
	}, []);

	useEffect(() => {
		if (!loading && !delayedLoading) {
			if (!token) {
				router.replace("/login");
			} else if (role && user?.role !== role) {
				router.replace("/dashboard");
			}
		}
	}, [loading, delayedLoading, token, user, role, router]);

	if (loading || delayedLoading) {
		return <LoadingPage message="Loading..." />;
	}

	if (!token) return null;

	return <>{children}</>;
}

export function VerifyPermissions({
	children,
	role,
}: {
	children: ReactNode;
	role: string;
}) {
	const { user } = useAuth();

	if (!user) return null;

	if (user.role !== role) return null;

	return <>{children}</>;
}

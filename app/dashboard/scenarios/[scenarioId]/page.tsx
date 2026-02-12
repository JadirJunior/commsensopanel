"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	BarChart3,
	Cpu,
	MapPin,
	Activity,
	ImageIcon,
	Loader2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { UserTenant, UserScenario } from "@/types/auth";
import { apiService } from "@/lib/api";

interface ScenarioStats {
	devices: number;
	spots: number;
	activeRules: number;
	imagesGenerated: number;
}

export default function ScenarioOverviewPage() {
	const params = useParams();
	const { user } = useAuth();
	const scenarioId = params.scenarioId as string;

	const [stats, setStats] = useState<ScenarioStats>({
		devices: 0,
		spots: 0,
		activeRules: 0,
		imagesGenerated: 0,
	});
	const [isLoading, setIsLoading] = useState(true);

	const scenarioData = useMemo((): {
		userTenant: UserTenant | null;
		userScenario: UserScenario | null;
		tenantId: string;
	} => {
		if (!user?.userTenants)
			return { userTenant: null, userScenario: null, tenantId: "" };

		for (const ut of user.userTenants) {
			const us = ut.UserScenarios?.find(
				(scenario) => scenario.Scenario?.id === scenarioId,
			);
			if (us) {
				return { userTenant: ut, userScenario: us, tenantId: ut.tenantId };
			}
		}
		return { userTenant: null, userScenario: null, tenantId: "" };
	}, [user, scenarioId]);

	const { userTenant, userScenario, tenantId } = scenarioData;

	const fetchStats = useCallback(async () => {
		if (!tenantId || !scenarioId) {
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		try {
			const headers = {
				"x-tenant-id": tenantId,
				"x-scenario-id": scenarioId,
			};

			const response = await apiService.fetchWithAuth<{
				devices: number;
				spots: number;
			}>("/scenario/stats", { headers });

			setStats({
				devices: response.data?.devices ?? 0,
				spots: response.data?.spots ?? 0,
				activeRules: 0, // TODO: endpoint de regras
				imagesGenerated: 0, // TODO: endpoint de imagens
			});
		} catch (error) {
			console.error("Failed to fetch stats:", error);
		} finally {
			setIsLoading(false);
		}
	}, [tenantId, scenarioId]);

	useEffect(() => {
		if (tenantId) {
			fetchStats();
		}
	}, [tenantId, fetchStats]);

	// Stats cards
	const statsCards = [
		{
			title: "Dispositivos",
			value: stats.devices,
			description: "Total cadastrados",
			icon: Cpu,
			color: "text-blue-600 dark:text-blue-400",
			bgColor: "bg-blue-100 dark:bg-blue-900/30",
		},
		{
			title: "Spots",
			value: stats.spots,
			description: "Pontos de medição",
			icon: MapPin,
			color: "text-emerald-600 dark:text-emerald-400",
			bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
		},
		{
			title: "Regras Ativas",
			value: stats.activeRules,
			description: "Regras de sensor",
			icon: Activity,
			color: "text-amber-600 dark:text-amber-400",
			bgColor: "bg-amber-100 dark:bg-amber-900/30",
		},
		{
			title: "Imagens Geradas",
			value: stats.imagesGenerated,
			description: "Este mês",
			icon: ImageIcon,
			color: "text-purple-600 dark:text-purple-400",
			bgColor: "bg-purple-100 dark:bg-purple-900/30",
		},
	];

	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
			{/* Header */}
			<div>
				<h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
					<BarChart3 className="w-6 h-6 text-emerald-600" />
					Visão Geral
				</h2>
				<p className="text-gray-600 dark:text-gray-400 mt-1">
					Acompanhe os indicadores e métricas do cenário{" "}
					<span className="font-medium text-emerald-600 dark:text-emerald-400">
						{userScenario?.Scenario?.name}
					</span>
				</p>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{statsCards.map((stat) => (
					<Card
						key={stat.title}
						className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
					>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
								{stat.title}
							</CardTitle>
							<div
								className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}
							>
								<stat.icon className={`w-4 h-4 ${stat.color}`} />
							</div>
						</CardHeader>
						<CardContent>
							{isLoading ? (
								<Loader2 className="w-6 h-6 animate-spin text-gray-400" />
							) : (
								<div className="text-2xl font-bold text-gray-900 dark:text-white">
									{stat.value}
								</div>
							)}
							<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
								{stat.description}
							</p>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Informações do Cenário */}
			<Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
				<CardHeader>
					<CardTitle className="text-gray-900 dark:text-white">
						Informações do Cenário
					</CardTitle>
					<CardDescription>
						Detalhes e configurações do cenário atual
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<p className="text-sm text-gray-500 dark:text-gray-400">Nome</p>
							<p className="font-medium text-gray-900 dark:text-white">
								{userScenario?.Scenario?.name || "—"}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-500 dark:text-gray-400">Slug</p>
							<p className="font-mono text-gray-900 dark:text-white">
								{userScenario?.Scenario?.slug || "—"}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								Instituição
							</p>
							<p className="font-medium text-gray-900 dark:text-white">
								{userTenant?.Tenant?.name || "—"}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								Seu Cargo
							</p>
							<p className="font-medium text-emerald-600 dark:text-emerald-400">
								{userScenario?.ScenarioRole?.name || "—"}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

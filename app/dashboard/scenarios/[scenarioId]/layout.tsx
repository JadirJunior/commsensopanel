"use client";

import { ReactNode, useMemo } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
	Cpu,
	MapPin,
	ImageIcon,
	Users,
	Shield,
	BarChart3,
	ArrowLeft,
	Settings,
	Activity,
	LineChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { VerifyPermissions } from "@/components/rbac";
import { SCENARIO_PERMISSIONS } from "@/constants/permissions";
import { UserScenario, UserTenant } from "@/types/auth";
import Image from "next/image";
import { LoadingScreen } from "@/components/ui/loading-screen";

interface NavItem {
	id: string;
	label: string;
	icon: React.ElementType;
	href: string;
	permission?: string;
}

export default function ScenarioLayout({ children }: { children: ReactNode }) {
	const params = useParams();
	const pathname = usePathname();
	const router = useRouter();
	const { user, isLoading } = useAuth();

	const scenarioId = params.scenarioId as string;

	// Encontra o tenant e cenário do usuário usando useMemo para evitar re-renders
	const { userTenant, userScenario } = useMemo(() => {
		if (!user?.userTenants) return { userTenant: null, userScenario: null };

		for (const ut of user.userTenants) {
			const us = ut.UserScenarios?.find(
				(scenario) => scenario.Scenario?.id === scenarioId,
			);
			if (us) {
				return { userTenant: ut, userScenario: us };
			}
		}
		return { userTenant: null, userScenario: null };
	}, [user, scenarioId]);

	// Itens de navegação do menu lateral
	const navItems: NavItem[] = [
		{
			id: "overview",
			label: "Visão Geral",
			icon: BarChart3,
			href: `/dashboard/scenarios/${scenarioId}`,
		},
		{
			id: "measurements",
			label: "Medições",
			icon: LineChart,
			href: `/dashboard/scenarios/${scenarioId}/measurements`,
			permission: SCENARIO_PERMISSIONS.MEASUREMENT_VIEW,
		},
		{
			id: "devices",
			label: "Dispositivos",
			icon: Cpu,
			href: `/dashboard/scenarios/${scenarioId}/devices`,
			permission: SCENARIO_PERMISSIONS.DEVICE_VIEW,
		},
		{
			id: "spots",
			label: "Spots",
			icon: MapPin,
			href: `/dashboard/scenarios/${scenarioId}/spots`,
			permission: SCENARIO_PERMISSIONS.SPOT_VIEW,
		},
		{
			id: "rules",
			label: "Regras de Sensor",
			icon: Activity,
			href: `/dashboard/scenarios/${scenarioId}/rules`,
			permission: SCENARIO_PERMISSIONS.SENSOR_RULE_VIEW,
		},
		{
			id: "image-generation",
			label: "Geração de Imagens",
			icon: ImageIcon,
			href: `/dashboard/scenarios/${scenarioId}/image-generation`,
			permission: SCENARIO_PERMISSIONS.IMAGE_GENERATION_VIEW,
		},
		{
			id: "users",
			label: "Usuários",
			icon: Users,
			href: `/dashboard/scenarios/${scenarioId}/users`,
			permission: SCENARIO_PERMISSIONS.USER_VIEW,
		},
		{
			id: "roles",
			label: "Cargos",
			icon: Shield,
			href: `/dashboard/scenarios/${scenarioId}/roles`,
			permission: SCENARIO_PERMISSIONS.ROLE_VIEW,
		},
	];

	// Identifica qual item está ativo baseado no pathname
	const getActiveItem = () => {
		// Remove trailing slash se existir
		const normalizedPath = pathname.endsWith("/")
			? pathname.slice(0, -1)
			: pathname;

		// Verifica se é a página base (overview)
		if (normalizedPath === `/dashboard/scenarios/${scenarioId}`) {
			return "overview";
		}

		// Verifica os outros itens
		const activeItem = navItems.find(
			(item) => item.id !== "overview" && normalizedPath.includes(item.href),
		);
		return activeItem?.id || "overview";
	};

	const activeItem = getActiveItem();

	if (isLoading) {
		return <LoadingScreen isLoading={true} minDuration={1000} />;
	}

	if (!userTenant || !userScenario) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
				<div className="text-center max-w-md px-4">
					<Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
						Cenário não encontrado
					</h2>
					<p className="mt-2 text-gray-600 dark:text-gray-400">
						Você não tem acesso a este cenário ou ele não existe.
					</p>
					<Button
						onClick={() => router.push("/dashboard")}
						variant="outline"
						className="mt-6"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Voltar ao Dashboard
					</Button>
				</div>
			</div>
		);
	}

	const NavItemComponent = ({ item }: { item: NavItem }) => {
		const isActive = activeItem === item.id;
		const Icon = item.icon;

		const buttonContent = (
			<button
				onClick={() => router.push(item.href)}
				className={cn(
					"w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
					isActive
						? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-l-2 border-emerald-500"
						: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100",
				)}
			>
				<Icon className={cn("w-5 h-5", isActive && "text-emerald-500")} />
				{item.label}
			</button>
		);

		// Se tem permissão necessária, envolve com VerifyPermissions
		if (item.permission) {
			return (
				<VerifyPermissions
					scope="scenario"
					tenantId={userTenant.tenantId}
					scenarioId={scenarioId}
					permissions={item.permission}
				>
					{buttonContent}
				</VerifyPermissions>
			);
		}

		return buttonContent;
	};

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-950">
			{/* Header */}
			<header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-20 dark:bg-gray-900/80 dark:border-gray-800">
				<div className="px-4 py-3 flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => router.push("/dashboard")}
							className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
						>
							<ArrowLeft className="w-5 h-5" />
						</Button>
						<div className="flex items-center gap-3">
							<Image
								src="/commsenso-iot-logo.png"
								alt="CommSenso"
								width={32}
								height={32}
								className="object-contain"
							/>
							<div className="flex flex-col">
								<span className="text-xs text-gray-500 dark:text-gray-400">
									{userTenant.Tenant?.name}
								</span>
								<h1 className="text-lg font-semibold text-gray-900 dark:text-white">
									{userScenario.Scenario?.name}
								</h1>
							</div>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-xs px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
							{userScenario.ScenarioRole?.name}
						</span>
					</div>
				</div>
			</header>

			<div className="flex">
				{/* Sidebar */}
				<aside className="w-64 min-h-[calc(100vh-57px)] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
					<nav className="space-y-1">
						{navItems.map((item) => (
							<NavItemComponent key={item.id} item={item} />
						))}
					</nav>

					{/* Footer do Sidebar */}
					<div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-800">
						<div className="text-xs text-gray-500 dark:text-gray-400">
							<p>Cenário ID:</p>
							<p className="font-mono text-gray-600 dark:text-gray-300 truncate">
								{scenarioId.slice(0, 12)}...
							</p>
						</div>
					</div>
				</aside>

				{/* Main Content */}
				<main className="flex-1 p-6 overflow-auto">{children}</main>
			</div>
		</div>
	);
}

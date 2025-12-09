"use client";

import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Cpu,
	Box,
	Settings,
	Plus,
	ChevronRight,
	Zap,
	Wifi,
	Thermometer,
	Droplets,
	Wind,
	Gauge,
	ShieldCheck,
	Building2,
	Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { TenantsTab } from "./TenantsTab";
import { BoilerplatesTab } from "./BoilerplatesTab";

type AdminTabType = "overview" | "boilerplates" | "tenants" | "users";

interface AdminPanelProps {
	onBack: () => void;
}

const ADMIN_FEATURES = [
	{
		id: "boilerplates",
		title: "Boilerplates de Dispositivos",
		description: "Gerencie templates de dispositivos IoT",
		icon: Box,
		color: "emerald",
		stats: { label: "Templates", value: "—" },
	},
	{
		id: "tenants",
		title: "Instituições",
		description: "Gerencie as instituições do sistema",
		icon: Building2,
		color: "blue",
		stats: { label: "Instituições", value: "—" },
	},
];

export function AdminPanel({ onBack }: AdminPanelProps) {
	const [activeTab, setActiveTab] = useState<AdminTabType>("overview");

	const renderContent = () => {
		switch (activeTab) {
			case "boilerplates":
				return <BoilerplatesTab />;
			case "tenants":
				return <TenantsTab />;
			default:
				return (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{ADMIN_FEATURES.map((feature) => {
							const Icon = feature.icon;
							const colorClasses = {
								emerald: {
									bg: "bg-emerald-50 dark:bg-emerald-900/20",
									icon: "text-emerald-600 dark:text-emerald-400",
									hover:
										"hover:border-emerald-500 dark:hover:border-emerald-500/50",
									badge:
										"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
								},
								blue: {
									bg: "bg-blue-50 dark:bg-blue-900/20",
									icon: "text-blue-600 dark:text-blue-400",
									hover: "hover:border-blue-500 dark:hover:border-blue-500/50",
									badge:
										"bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
								},
								purple: {
									bg: "bg-purple-50 dark:bg-purple-900/20",
									icon: "text-purple-600 dark:text-purple-400",
									hover:
										"hover:border-purple-500 dark:hover:border-purple-500/50",
									badge:
										"bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
								},
							}[feature.color];

							return (
								<Card
									key={feature.id}
									className={cn(
										"cursor-pointer transition-all duration-300 hover:shadow-lg group",
										colorClasses?.hover
									)}
									onClick={() => setActiveTab(feature.id as AdminTabType)}
								>
									<CardHeader>
										<div className="flex items-start justify-between">
											<div
												className={cn(
													"w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform",
													colorClasses?.bg
												)}
											>
												<Icon className={cn("w-6 h-6", colorClasses?.icon)} />
											</div>
											<Badge
												variant="secondary"
												className={cn("text-xs", colorClasses?.badge)}
											>
												{feature.stats.value} {feature.stats.label}
											</Badge>
										</div>
										<CardTitle className="text-lg text-gray-800 dark:text-gray-100">
											{feature.title}
										</CardTitle>
										<CardDescription>{feature.description}</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="flex items-center justify-end text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
											Acessar
											<ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				);
		}
	};

	return (
		<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div className="mb-8">
				<div className="flex items-center gap-4 mb-6">
					<Button
						variant="outline"
						size="icon"
						onClick={
							activeTab === "overview" ? onBack : () => setActiveTab("overview")
						}
						className="rounded-full border-slate-600 text-slate-300 bg-slate-800/50 hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-all shadow-sm"
					>
						<ChevronRight className="w-5 h-5 rotate-180" />
					</Button>
					<div>
						<div className="flex items-center gap-2">
							<h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
								{activeTab === "overview"
									? "Painel de Administração"
									: activeTab === "boilerplates"
									? "Boilerplates de Dispositivos"
									: activeTab === "tenants"
									? "Gerenciamento de Instituições"
									: "Gerenciamento de Usuários"}
							</h2>
							<Badge
								variant="outline"
								className="border-amber-500 text-amber-600 dark:text-amber-400"
							>
								<ShieldCheck className="w-3 h-3 mr-1" />
								Admin
							</Badge>
						</div>
						<p className="text-gray-600 dark:text-gray-400">
							{activeTab === "overview"
								? "Gerencie recursos globais do sistema"
								: activeTab === "boilerplates"
								? "Configure templates para novos dispositivos IoT"
								: activeTab === "tenants"
								? "Visualize e gerencie as instituições cadastradas"
								: "Visualize e gerencie os usuários do sistema"}
						</p>
					</div>
				</div>

				{/* Navigation Breadcrumb */}
				{activeTab !== "overview" && (
					<div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
						<button
							onClick={() => setActiveTab("overview")}
							className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
						>
							Painel Admin
						</button>
						<ChevronRight className="w-4 h-4" />
						<span className="text-gray-700 dark:text-gray-200">
							{activeTab === "boilerplates"
								? "Boilerplates"
								: activeTab === "tenants"
								? "Instituições"
								: "Usuários"}
						</span>
					</div>
				)}
			</div>

			{renderContent()}
		</div>
	);
}

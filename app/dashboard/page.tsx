"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	LogOut,
	User,
	Building2,
	UserCircle,
	ArrowLeft,
	LayoutDashboard,
	Users,
	Shield,
	Settings,
	ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { UserTenant } from "@/types/auth";
import { ProfileDialog } from "@/components/profile/ProfileDialog";
import { RolesTab } from "@/components/dashboard/roles/RolesTab";
import { UsersTab } from "@/components/dashboard/users/UsersTab";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { AdminPanel } from "@/components/dashboard/admin";
import { TENANT_PERMISSIONS } from "@/constants/permissions";
import { VerifyPermissions } from "@/components/rbac";
import { cn } from "@/lib/utils";
import { TenantView } from "./_components/tenant-view";

export default function DashboardPage() {
	const { user, logout, isAuthenticated, isLoading } = useAuth();
	const router = useRouter();
	const [selectedTenant, setSelectedTenant] = useState<UserTenant | null>(null);
	const [showAdminPanel, setShowAdminPanel] = useState(false);

	// Verifica se o usuário é administrador do sistema
	const isSystemAdmin = user?.systemAdmin === true;

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			router.replace("/login");
		}
	}, [isAuthenticated, isLoading, router]);

	if (isLoading) {
		return <LoadingScreen isLoading={true} minDuration={1500} />;
	}

	if (!isAuthenticated || !user) {
		return null;
	}

	// Se o usuário não tem tenants, mostra mensagem
	if (!user.userTenants || user.userTenants.length === 0) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
				<div className="text-center max-w-md px-4">
					<Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
						Nenhuma instituição encontrada
					</h2>
					<p className="mt-2 text-gray-600 dark:text-gray-400">
						Você não está vinculado a nenhuma instituição. Entre em contato com
						o administrador.
					</p>
					<Button onClick={logout} variant="outline" className="mt-6">
						<LogOut className="w-4 h-4 mr-2" />
						Sair
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-950">
			{/* Header */}
			<header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10 dark:bg-gray-900/80 dark:border-gray-800">
				<div className="container mx-auto px-4 py-4 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Image
							src="/commsenso-iot-logo.png"
							alt="CommSenso"
							width={40}
							height={40}
							className="object-contain"
						/>
						<div>
							<h1 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
								CommSenso
							</h1>
							<p className="text-xs text-gray-500 dark:text-gray-400">IoT</p>
						</div>
					</div>

					<div className="flex items-center gap-4">
						{isSystemAdmin && (
							<Button
								variant={showAdminPanel ? "default" : "outline"}
								size="sm"
								onClick={() => {
									setShowAdminPanel(!showAdminPanel);
									setSelectedTenant(null);
								}}
								className={cn(
									"transition-all",
									showAdminPanel
										? "bg-amber-600 hover:bg-amber-700 text-white border-amber-600"
										: "border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
								)}
							>
								<ShieldCheck className="w-4 h-4 mr-2" />
								Admin
							</Button>
						)}
						<ProfileDialog>
							<Button
								variant="ghost"
								size="sm"
								className="text-gray-600 dark:text-gray-300"
							>
								<UserCircle className="w-4 h-4 mr-2" />
								{user.name || user.username}
							</Button>
						</ProfileDialog>
						<Button
							variant="outline"
							size="sm"
							onClick={logout}
							className="border-slate-600 text-slate-300 bg-slate-800/50 hover:bg-red-600/20 hover:text-red-400 hover:border-red-500/50 transition-all"
						>
							<LogOut className="w-4 h-4 mr-2" />
							Sair
						</Button>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="container mx-auto px-4 py-8">
				{showAdminPanel && isSystemAdmin ? (
					<AdminPanel onBack={() => setShowAdminPanel(false)} />
				) : selectedTenant ? (
					<TenantView
						tenant={selectedTenant}
						onBack={() => setSelectedTenant(null)}
					/>
				) : (
					// View de Seleção de Tenant
					<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
						<div className="mb-8 text-center max-w-2xl mx-auto">
							<h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3">
								Minhas Instituições
							</h2>
							<p className="text-gray-600 dark:text-gray-400 text-lg">
								Selecione a instituição que deseja acessar para visualizar seus
								indicadores de sustentabilidade
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
							{user.userTenants.map((userTenant) => (
								<Card
									key={userTenant.id}
									className="hover:shadow-xl transition-all duration-300 cursor-pointer border-t-4 border-t-emerald-500 hover:-translate-y-1 group"
									onClick={() => setSelectedTenant(userTenant)}
								>
									<CardHeader>
										<div className="flex justify-between items-start mb-4">
											<div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
												<Building2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
											</div>
											<span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
												{userTenant.TenantRole?.name || "Membro"}
											</span>
										</div>
										<CardTitle className="text-xl text-gray-800 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
											{userTenant.Tenant?.name || "Instituição sem nome"}
										</CardTitle>
										<CardDescription className="line-clamp-2">
											{userTenant.Tenant?.description ||
												"Sem descrição disponível"}
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
											<span className="text-sm text-gray-500 dark:text-gray-400">
												{userTenant.UserScenarios?.length || 0} cenários
												disponíveis
											</span>
											<Button
												variant="ghost"
												size="sm"
												className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 font-medium cursor-pointer transition-colors"
											>
												Acessar{" "}
												<ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				)}
			</main>
		</div>
	);
}

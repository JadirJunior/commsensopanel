"use client";
import { RolesTab } from "@/components/dashboard/roles/RolesTab";
import { UsersTab } from "@/components/dashboard/users/UsersTab";
import { ScenariosManagementDialog } from "@/components/dashboard/scenarios/ScenariosManagementDialog";
import { VerifyPermissions } from "@/components/rbac";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { TENANT_PERMISSIONS } from "@/constants/permissions";
import { cn } from "@/lib/utils";
import { UserTenant } from "@/types/auth";
import {
	ArrowLeft,
	LayoutDashboard,
	Settings,
	Shield,
	User,
	Users,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Componente que renderiza a view do tenant selecionado
export function TenantView({
	tenant,
	onBack,
}: {
	tenant: UserTenant;
	onBack: () => void;
}) {
	const router = useRouter(); // Adicionado hook useRouter
	const [activeTab, setActiveTab] = useState<"scenarios" | "users" | "roles">(
		"scenarios"
	);
	const [isScenariosManagementOpen, setIsScenariosManagementOpen] =
		useState(false);

	return (
		<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div className="mb-8">
				<div className="flex items-center gap-4 mb-6">
					<Button
						variant="outline"
						size="icon"
						onClick={onBack}
						className="rounded-full border-slate-600 text-slate-300 bg-slate-800/50 hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-all shadow-sm"
					>
						<ArrowLeft className="w-5 h-5" />
					</Button>
					<div>
						<h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
							{tenant.Tenant?.name || "Instituição"}
						</h2>
						<p className="text-gray-600 dark:text-gray-400">
							Gerencie cenários e acessos da instituição
						</p>
					</div>
				</div>

				{/* Tabs de Navegação */}
				<div className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 w-fit">
					<button
						onClick={() => setActiveTab("scenarios")}
						className={cn(
							"flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
							activeTab === "scenarios"
								? "bg-white dark:bg-gray-950 text-emerald-600 dark:text-emerald-400 shadow-sm"
								: "text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
						)}
					>
						<LayoutDashboard className="w-4 h-4" />
						Cenários
					</button>

					<VerifyPermissions
						scope="tenant"
						tenantId={tenant.tenantId}
						permissions={TENANT_PERMISSIONS.USER_VIEW}
					>
						<button
							onClick={() => setActiveTab("users")}
							className={cn(
								"flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
								activeTab === "users"
									? "bg-white dark:bg-gray-950 text-emerald-600 dark:text-emerald-400 shadow-sm"
									: "text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
							)}
						>
							<Users className="w-4 h-4" />
							Usuários
						</button>
					</VerifyPermissions>

					<VerifyPermissions
						scope="tenant"
						tenantId={tenant.tenantId}
						permissions={TENANT_PERMISSIONS.ROLE_VIEW}
					>
						<button
							onClick={() => setActiveTab("roles")}
							className={cn(
								"flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
								activeTab === "roles"
									? "bg-white dark:bg-gray-950 text-emerald-600 dark:text-emerald-400 shadow-sm"
									: "text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
							)}
						>
							<Shield className="w-4 h-4" />
							Cargos
						</button>
					</VerifyPermissions>
				</div>
			</div>

			{/* Conteúdo das Tabs */}
			<div className="mt-6">
				{activeTab === "scenarios" && (
					<>
						{tenant.UserScenarios && tenant.UserScenarios.length > 0 ? (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{tenant.UserScenarios.map((userScenario) => (
									<Card
										key={userScenario.id}
										className="hover:shadow-lg transition-all duration-300 cursor-pointer border-emerald-100 dark:border-emerald-900/30 group"
										onClick={() => {
											router.push(
												`/dashboard/scenarios/${userScenario.Scenario?.id}`
											);
										}}
									>
										<CardHeader>
											<div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
												<LayoutDashboard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
											</div>
											<CardTitle className="text-xl text-gray-800 dark:text-gray-100">
												{userScenario.Scenario?.name || "Cenário sem nome"}
											</CardTitle>
											<CardDescription>
												{userScenario.Scenario?.slug}
											</CardDescription>
										</CardHeader>
										<CardContent>
											<div className="flex items-center justify-between text-sm text-gray-500">
												<span className="flex items-center gap-1">
													<User className="w-4 h-4" />
													{userScenario.ScenarioRole?.name || "Sem papel"}
												</span>
												<ArrowLeft className="w-4 h-4 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
											</div>
										</CardContent>
									</Card>
								))}
								<VerifyPermissions
									scope="tenant"
									tenantId={tenant.tenantId}
									permissions={TENANT_PERMISSIONS.SCENARIO_EDIT}
								>
									<Card
										onClick={() => setIsScenariosManagementOpen(true)}
										className="border-dashed border-2 border-gray-200 dark:border-gray-800 hover:border-emerald-500 dark:hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[200px] group"
									>
										<div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
											<Settings className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
										</div>
										<span className="font-medium text-gray-600 dark:text-gray-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
											Gerenciar Cenários
										</span>
									</Card>
								</VerifyPermissions>
							</div>
						) : (
							<div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
								<LayoutDashboard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
								<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
									Nenhum cenário disponível
								</h3>
								<p className="text-gray-500 dark:text-gray-400 mt-1">
									Você não tem acesso a nenhum cenário nesta instituição.
								</p>
							</div>
						)}
					</>
				)}

				{activeTab === "users" && (
					<VerifyPermissions
						scope="tenant"
						tenantId={tenant.tenantId}
						permissions={TENANT_PERMISSIONS.USER_VIEW}
					>
						<div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
							<UsersTab tenantId={tenant.tenantId} />
						</div>
					</VerifyPermissions>
				)}

				{activeTab === "roles" && (
					<VerifyPermissions
						scope="tenant"
						tenantId={tenant.tenantId}
						permissions={TENANT_PERMISSIONS.ROLE_VIEW}
					>
						<div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
							<RolesTab tenantId={tenant.tenantId} />
						</div>
					</VerifyPermissions>
				)}
			</div>

			{/* Dialog para gerenciar cenários */}
			<ScenariosManagementDialog
				open={isScenariosManagementOpen}
				onOpenChange={setIsScenariosManagementOpen}
				tenantId={tenant.tenantId}
			/>
		</div>
	);
}

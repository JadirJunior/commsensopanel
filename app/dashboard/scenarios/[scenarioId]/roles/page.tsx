"use client";

import { useParams } from "next/navigation";
import { VerifyPermissions } from "@/components/rbac";
import { SCENARIO_PERMISSIONS } from "@/constants/permissions";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Shield,
	Search,
	ShieldPlus,
	Pencil,
	Trash2,
	Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMemo, useState, useEffect } from "react";
import {
	ScenarioRole,
	ScenarioRoleDialog,
} from "@/components/dashboard/roles/ScenarioRoleDialog";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ScenarioRolesPage() {
	const params = useParams();
	const { user } = useAuth();
	const scenarioId = params.scenarioId as string;

	const [roles, setRoles] = useState<ScenarioRole[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingRole, setEditingRole] = useState<ScenarioRole | null>(null);

	const tenantId = useMemo(() => {
		if (!user?.userTenants) return "";
		for (const ut of user.userTenants) {
			const us = ut.UserScenarios?.find(
				(scenario) => scenario.Scenario?.id === scenarioId
			);
			if (us) return ut.tenantId;
		}
		return "";
	}, [user, scenarioId]);

	const fetchRoles = async () => {
		try {
			setIsLoading(true);
			const response = await apiService.fetchWithAuth<ScenarioRole[]>(
				`/scenario/roles`,
				{
					headers: {
						"x-tenant-id": tenantId,
						"x-scenario-id": scenarioId,
					},
				}
			);
			if (response.data) {
				setRoles(response.data);
			}
		} catch (error) {
			console.error("Erro ao buscar cargos:", error);
			toast.error("Não foi possível carregar os cargos.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (scenarioId && tenantId) {
			fetchRoles();
		}
	}, [scenarioId, tenantId]);

	const handleDeleteRole = async (roleId: string) => {
		if (!confirm("Tem certeza que deseja excluir este cargo?")) return;

		try {
			await apiService.fetchWithAuth(`/scenario/roles/${roleId}`, {
				method: "DELETE",
				headers: {
					"x-tenant-id": tenantId,
					"x-scenario-id": scenarioId,
				},
			});
			toast.success("Cargo excluído com sucesso!");
			fetchRoles();
		} catch (error) {
			console.error("Erro ao excluir cargo:", error);
			toast.error("Erro ao excluir o cargo.");
		}
	};

	const filteredRoles = roles.filter((role) =>
		role.name.toLowerCase().includes(search.toLowerCase())
	);

	return (
		<VerifyPermissions
			scope="scenario"
			tenantId={tenantId}
			scenarioId={scenarioId}
			permissions={SCENARIO_PERMISSIONS.ROLE_VIEW}
			fallback={
				<div className="flex items-center justify-center h-64">
					<div className="text-center">
						<Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
						<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
							Acesso Negado
						</h3>
						<p className="text-gray-500 dark:text-gray-400 mt-1">
							Você não tem permissão para gerenciar cargos do cenário.
						</p>
					</div>
				</div>
			}
		>
			<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
							<Shield className="w-6 h-6 text-rose-600" />
							Cargos do Cenário
						</h2>
						<p className="text-gray-600 dark:text-gray-400 mt-1">
							Configure os cargos e permissões específicos deste cenário
						</p>
					</div>
					<VerifyPermissions
						scope="scenario"
						tenantId={tenantId}
						scenarioId={scenarioId}
						permissions={SCENARIO_PERMISSIONS.ROLE_EDIT}
					>
						<Button
							className="gap-2"
							onClick={() => {
								setEditingRole(null);
								setIsDialogOpen(true);
							}}
						>
							<ShieldPlus className="w-4 h-4" />
							Novo Cargo
						</Button>
					</VerifyPermissions>
				</div>

				{/* Search */}
				<div className="flex gap-4">
					<div className="relative flex-1 max-w-md">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<Input
							placeholder="Buscar cargos..."
							className="pl-10"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>
				</div>

				{/* Content */}
				{isLoading ? (
					<div className="flex justify-center py-12">
						<Loader2 className="w-8 h-8 animate-spin text-rose-600" />
					</div>
				) : filteredRoles.length === 0 ? (
					<Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 border-dashed">
						<CardContent className="flex flex-col items-center justify-center py-12">
							<Shield className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
							<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
								Nenhum cargo encontrado
							</h3>
							<p className="text-gray-500 dark:text-gray-400 mt-1 text-center max-w-md">
								{search
									? "Tente buscar com outro termo."
									: "Configure cargos para definir as permissões dos usuários neste cenário."}
							</p>
							{!search && (
								<VerifyPermissions
									scope="scenario"
									tenantId={tenantId}
									scenarioId={scenarioId}
									permissions={SCENARIO_PERMISSIONS.ROLE_EDIT}
								>
									<Button
										className="mt-4 gap-2"
										onClick={() => {
											setEditingRole(null);
											setIsDialogOpen(true);
										}}
									>
										<ShieldPlus className="w-4 h-4" />
										Criar Primeiro Cargo
									</Button>
								</VerifyPermissions>
							)}
						</CardContent>
					</Card>
				) : (
					<div className="border rounded-lg overflow-hidden">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Nome</TableHead>
									<TableHead>Descrição</TableHead>
									<TableHead>Permissões</TableHead>
									<TableHead className="w-[100px]">Ações</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredRoles.map((role) => (
									<TableRow key={role.id}>
										<TableCell className="font-medium">{role.name}</TableCell>
										<TableCell>{role.description || "-"}</TableCell>
										<TableCell>
											<Badge variant="secondary">
												{role.resources.length} recursos
											</Badge>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<VerifyPermissions
													scope="scenario"
													tenantId={tenantId}
													scenarioId={scenarioId}
													permissions={SCENARIO_PERMISSIONS.ROLE_EDIT}
												>
													<Button
														variant="ghost"
														size="icon"
														onClick={() => {
															setEditingRole(role);
															setIsDialogOpen(true);
														}}
													>
														<Pencil className="w-4 h-4" />
													</Button>
												</VerifyPermissions>
												<VerifyPermissions
													scope="scenario"
													tenantId={tenantId}
													scenarioId={scenarioId}
													permissions={SCENARIO_PERMISSIONS.ROLE_ALL}
												>
													<Button
														variant="ghost"
														size="icon"
														className="text-red-500 hover:text-red-600"
														onClick={() => handleDeleteRole(role.id)}
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												</VerifyPermissions>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}

				<ScenarioRoleDialog
					open={isDialogOpen}
					onOpenChange={setIsDialogOpen}
					scenarioId={scenarioId}
					tenantId={tenantId}
					editingRole={editingRole}
					onSaved={fetchRoles}
				/>
			</div>
		</VerifyPermissions>
	);
}

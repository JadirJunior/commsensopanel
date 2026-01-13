"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	MoreHorizontal,
	Plus,
	Pencil,
	Trash2,
	Loader2,
	Users,
	LayoutDashboard,
	ArrowLeft,
	Save,
	Shield,
} from "lucide-react";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { useVerifyPermissions } from "@/components/rbac";
import { TENANT_PERMISSIONS } from "@/constants/permissions";
import { AssignUserScenarioDialog } from "./AssignUserScenarioDialog";
import { ScenarioRoleDialog } from "../roles/ScenarioRoleDialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface Scenario {
	id: string;
	name: string;
	slug: string;
	tenantId: string;
}

interface ScenarioRole {
	id: string;
	name: string;
	description: string;
	resources: string[];
	scenarioId: string;
}

interface ScenarioUser {
	id: string;
	scenarioId: string;
	userTenantId: string;
	roleId: string;
	ScenarioRole: {
		id: string;
		name: string;
	};
	UserTenant: {
		id: string;
		user: {
			id: string;
			username: string;
			email: string;
		};
	};
}

interface ScenariosManagementDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	tenantId: string;
	onDataChanged?: () => void;
}

export function ScenariosManagementDialog({
	open,
	onOpenChange,
	tenantId,
	onDataChanged,
}: ScenariosManagementDialogProps) {
	const { can } = useVerifyPermissions({
		scope: "tenant",
		tenantId,
	});
	const canEdit = can(TENANT_PERMISSIONS.SCENARIO_EDIT);
	const canDelete = can(TENANT_PERMISSIONS.SCENARIO_ALL);
	const canManageMembers = can(TENANT_PERMISSIONS.USER_EDIT);

	const [scenarios, setScenarios] = useState<Scenario[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [viewMode, setViewMode] = useState<
		"list" | "edit" | "members" | "roles"
	>("list");
	const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(
		null
	);
	const [formData, setFormData] = useState({ name: "", slug: "" });
	const [isSaving, setIsSaving] = useState(false);

	// Members Management State
	const [members, setMembers] = useState<ScenarioUser[]>([]);
	const [scenarioRoles, setScenarioRoles] = useState<ScenarioRole[]>([]);
	const [isMembersLoading, setIsMembersLoading] = useState(false);
	const [assignDialogOpen, setAssignDialogOpen] = useState(false);
	const [editingMember, setEditingMember] = useState<ScenarioUser | null>(null);

	// Roles Management State
	const [isRolesLoading, setIsRolesLoading] = useState(false);
	const [roleDialogOpen, setRoleDialogOpen] = useState(false);
	const [editingRole, setEditingRole] = useState<ScenarioRole | null>(null);

	// Confirmation Dialogs State
	const [deleteScenarioDialog, setDeleteScenarioDialog] = useState<{
		open: boolean;
		scenario: Scenario | null;
	}>({ open: false, scenario: null });
	const [removeMemberDialog, setRemoveMemberDialog] = useState<{
		open: boolean;
		member: ScenarioUser | null;
	}>({ open: false, member: null });
	const [deleteRoleDialog, setDeleteRoleDialog] = useState<{
		open: boolean;
		role: ScenarioRole | null;
	}>({ open: false, role: null });

	// Track if any changes were made
	const [hasChanges, setHasChanges] = useState(false);

	// Busca cenários do tenant
	const fetchScenarios = useCallback(async () => {
		try {
			setIsLoading(true);
			const response = await apiService.fetchWithAuth<Scenario[]>("/scenario", {
				headers: {
					"x-tenant-id": tenantId,
				},
			});
			if (response.data) {
				setScenarios(response.data);
			}
		} catch (error) {
			console.error("Erro ao buscar cenários:", error);
			toast.error("Não foi possível carregar os cenários.");
		} finally {
			setIsLoading(false);
		}
	}, [tenantId]);

	useEffect(() => {
		if (open) {
			fetchScenarios();
			setViewMode("list");
			setSelectedScenario(null);
			setHasChanges(false);
		} else if (!open && hasChanges && onDataChanged) {
			// Call onDataChanged when dialog closes if there were changes
			onDataChanged();
		}
	}, [open, fetchScenarios, hasChanges, onDataChanged]);

	// Busca membros do cenário
	const fetchMembers = useCallback(async () => {
		if (!selectedScenario) return;
		try {
			setIsMembersLoading(true);
			const response = await apiService.fetchWithAuth<ScenarioUser[]>(
				`/scenario-members/${selectedScenario.id}`,
				{
					headers: {
						"x-tenant-id": tenantId,
					},
				}
			);
			if (response.data) {
				setMembers(response.data);
			}
		} catch (error) {
			console.error("Erro ao buscar membros:", error);
			toast.error("Não foi possível carregar os membros.");
		} finally {
			setIsMembersLoading(false);
		}
	}, [selectedScenario, tenantId]);

	// Busca cargos do cenário
	const fetchScenarioRoles = useCallback(async () => {
		if (!selectedScenario) return;
		try {
			setIsRolesLoading(true);
			const response = await apiService.fetchWithAuth<ScenarioRole[]>(
				`/scenario/${selectedScenario.id}/roles`,
				{
					headers: {
						"x-tenant-id": tenantId,
					},
				}
			);
			if (response.data) {
				setScenarioRoles(response.data);
			}
		} catch (error) {
			console.error("Erro ao buscar cargos:", error);
		} finally {
			setIsRolesLoading(false);
		}
	}, [selectedScenario, tenantId]);

	useEffect(() => {
		if (viewMode === "members" && selectedScenario) {
			fetchMembers();
			fetchScenarioRoles();
		} else if (viewMode === "roles" && selectedScenario) {
			fetchScenarioRoles();
		}
	}, [viewMode, selectedScenario, fetchMembers, fetchScenarioRoles]);

	const handleCreate = () => {
		setSelectedScenario(null);
		setFormData({ name: "", slug: "" });
		setViewMode("edit");
	};

	const handleEdit = (scenario: Scenario) => {
		setSelectedScenario(scenario);
		setFormData({ name: scenario.name, slug: scenario.slug });
		setViewMode("edit");
	};

	const handleManageMembers = (scenario: Scenario) => {
		setSelectedScenario(scenario);
		setViewMode("members");
	};

	const handleManageRoles = (scenario: Scenario) => {
		setSelectedScenario(scenario);
		setViewMode("roles");
	};

	const handleSave = async () => {
		if (!formData.name || !formData.slug) {
			toast.error("Preencha todos os campos.");
			return;
		}

		try {
			setIsSaving(true);
			if (selectedScenario) {
				// Editar
				await apiService.fetchWithAuth(`/scenario/${selectedScenario.id}`, {
					method: "PUT",
					body: JSON.stringify({
						name: formData.name,
						slug: formData.slug,
					}),
					headers: {
						"x-tenant-id": tenantId,
					},
				});
				toast.success("Cenário atualizado com sucesso.");
			} else {
				// Criar
				await apiService.fetchWithAuth("/scenario", {
					method: "POST",
					body: JSON.stringify({
						name: formData.name,
						slug: formData.slug,
						tenantId,
					}),
					headers: {
						"x-tenant-id": tenantId,
					},
				});
				toast.success("Cenário criado com sucesso.");
			}
			setHasChanges(true);
			fetchScenarios();
			setViewMode("list");
		} catch (error) {
			console.error("Erro ao salvar cenário:", error);
			toast.error("Não foi possível salvar o cenário.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = (scenario: Scenario) => {
		setDeleteScenarioDialog({ open: true, scenario });
	};

	const confirmDeleteScenario = async () => {
		if (!deleteScenarioDialog.scenario) return;

		try {
			await apiService.fetchWithAuth(
				`/scenario/${deleteScenarioDialog.scenario.id}`,
				{
					method: "DELETE",
					headers: {
						"x-tenant-id": tenantId,
					},
				}
			);
			toast.success("Cenário excluído com sucesso.");
			setHasChanges(true);
			fetchScenarios();
		} catch (error) {
			console.error("Erro ao excluir cenário:", error);
			toast.error("Não foi possível excluir o cenário.");
		}
	};

	const handleRemoveMember = (member: ScenarioUser) => {
		setRemoveMemberDialog({ open: true, member });
	};

	const confirmRemoveMember = async () => {
		if (!removeMemberDialog.member) return;

		try {
			await apiService.fetchWithAuth(
				`/scenario-members/${selectedScenario?.id}/${removeMemberDialog.member.id}`,
				{
					method: "DELETE",
					headers: {
						"x-tenant-id": tenantId,
					},
				}
			);
			toast.success("Usuário removido com sucesso.");
			setHasChanges(true);
			fetchMembers();
		} catch (error) {
			console.error("Erro ao remover usuário:", error);
			toast.error("Não foi possível remover o usuário.");
		}
	};

	const handleEditMember = (member: ScenarioUser) => {
		setEditingMember(member);
		setAssignDialogOpen(true);
	};

	const handleAddMember = () => {
		setEditingMember(null);
		setAssignDialogOpen(true);
	};

	// Roles Actions
	const handleAddRole = () => {
		setEditingRole(null);
		setRoleDialogOpen(true);
	};

	const handleEditRole = (role: ScenarioRole) => {
		setEditingRole(role);
		setRoleDialogOpen(true);
	};

	const handleDeleteRole = (role: ScenarioRole) => {
		setDeleteRoleDialog({ open: true, role });
	};

	const confirmDeleteRole = async () => {
		if (!deleteRoleDialog.role) return;

		try {
			await apiService.fetchWithAuth(
				`/scenario/${selectedScenario?.id}/roles/${deleteRoleDialog.role.id}`,
				{
					method: "DELETE",
					headers: {
						"x-tenant-id": tenantId,
					},
				}
			);
			toast.success("Cargo excluído com sucesso.");
			setHasChanges(true);
			fetchScenarioRoles();
		} catch (error) {
			console.error("Erro ao excluir cargo:", error);
			toast.error("Não foi possível excluir o cargo.");
		}
	};

	const renderList = () => (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h3 className="text-lg font-medium">Cenários Disponíveis</h3>
				{canEdit && (
					<Button
						onClick={handleCreate}
						className="bg-emerald-600 hover:bg-emerald-700"
					>
						<Plus className="w-4 h-4 mr-2" />
						Novo Cenário
					</Button>
				)}
			</div>

			{isLoading ? (
				<div className="flex justify-center py-8">
					<Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
				</div>
			) : scenarios.length === 0 ? (
				<div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
					<LayoutDashboard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
					<p className="text-gray-500">Nenhum cenário encontrado.</p>
				</div>
			) : (
				<div className="grid gap-3">
					{scenarios.map((scenario) => (
						<div
							key={scenario.id}
							className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-500 transition-all bg-white dark:bg-gray-900"
						>
							<div className="flex items-center gap-4">
								<div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center">
									<LayoutDashboard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
								</div>
								<div>
									<h4 className="font-medium text-gray-900 dark:text-gray-100">
										{scenario.name}
									</h4>
									<p className="text-sm text-gray-500 dark:text-gray-400">
										{scenario.slug}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleManageMembers(scenario)}
									title="Gerenciar Membros"
								>
									<Users className="w-4 h-4" />
								</Button>
								{(canEdit || canDelete) && (
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="sm">
												<MoreHorizontal className="w-4 h-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											{canEdit && (
												<>
													<DropdownMenuItem
														onClick={() => handleEdit(scenario)}
													>
														<Pencil className="w-4 h-4 mr-2" />
														Editar Cenário
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => handleManageRoles(scenario)}
													>
														<Shield className="w-4 h-4 mr-2" />
														Gerenciar Cargos
													</DropdownMenuItem>
												</>
											)}
											{canDelete && (
												<DropdownMenuItem
													className="text-red-600"
													onClick={() => handleDelete(scenario)}
												>
													<Trash2 className="w-4 h-4 mr-2" />
													Excluir
												</DropdownMenuItem>
											)}
										</DropdownMenuContent>
									</DropdownMenu>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);

	const renderEdit = () => (
		<div className="space-y-4">
			<div className="flex items-center gap-4 mb-4">
				<Button variant="ghost" size="icon" onClick={() => setViewMode("list")}>
					<ArrowLeft className="w-4 h-4" />
				</Button>
				<h3 className="text-lg font-medium">
					{selectedScenario ? "Editar Cenário" : "Novo Cenário"}
				</h3>
			</div>

			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="name">Nome do Cenário</Label>
					<Input
						id="name"
						value={formData.name}
						onChange={(e) => setFormData({ ...formData, name: e.target.value })}
						placeholder="Ex: Matriz Principal"
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="slug">Slug (Identificador único)</Label>
					<Input
						id="slug"
						value={formData.slug}
						onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
						placeholder="Ex: matriz-principal"
					/>
				</div>
			</div>

			<div className="flex justify-end gap-2 mt-6">
				<Button variant="outline" onClick={() => setViewMode("list")}>
					Cancelar
				</Button>
				<Button
					onClick={handleSave}
					disabled={isSaving}
					className="bg-emerald-600 hover:bg-emerald-700"
				>
					{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
					<Save className="w-4 h-4 mr-2" />
					Salvar
				</Button>
			</div>
		</div>
	);

	const renderMembers = () => (
		<div className="space-y-4">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setViewMode("list")}
					>
						<ArrowLeft className="w-4 h-4" />
					</Button>
					<div>
						<h3 className="text-lg font-medium">Membros do Cenário</h3>
						<p className="text-sm text-gray-500">{selectedScenario?.name}</p>
					</div>
				</div>
				{canManageMembers && (
					<Button
						onClick={handleAddMember}
						className="bg-emerald-600 hover:bg-emerald-700"
					>
						<Plus className="w-4 h-4 mr-2" />
						Adicionar Membro
					</Button>
				)}
			</div>

			{isMembersLoading ? (
				<div className="flex justify-center py-8">
					<Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
				</div>
			) : members.length === 0 ? (
				<div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
					<Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
					<p className="text-gray-500">Nenhum membro neste cenário.</p>
				</div>
			) : (
				<div className="border rounded-lg overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Usuário</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Cargo</TableHead>
								{canManageMembers && (
									<TableHead className="w-[100px]"></TableHead>
								)}
							</TableRow>
						</TableHeader>
						<TableBody>
							{members.map((member) => (
								<TableRow key={member.id}>
									<TableCell className="font-medium">
										{member.UserTenant.user.username}
									</TableCell>
									<TableCell>{member.UserTenant.user.email}</TableCell>
									<TableCell>
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
											{member.ScenarioRole.name}
										</span>
									</TableCell>
									{canManageMembers && (
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="sm">
														<MoreHorizontal className="w-4 h-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() => handleEditMember(member)}
													>
														<Pencil className="w-4 h-4 mr-2" />
														Alterar Cargo
													</DropdownMenuItem>
													<DropdownMenuItem
														className="text-red-600"
														onClick={() => handleRemoveMember(member)}
													>
														<Trash2 className="w-4 h-4 mr-2" />
														Remover
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									)}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);

	const renderRoles = () => (
		<div className="space-y-4">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setViewMode("list")}
					>
						<ArrowLeft className="w-4 h-4" />
					</Button>
					<div>
						<h3 className="text-lg font-medium">Cargos do Cenário</h3>
						<p className="text-sm text-gray-500">{selectedScenario?.name}</p>
					</div>
				</div>
				{canEdit && (
					<Button
						onClick={handleAddRole}
						className="bg-emerald-600 hover:bg-emerald-700"
					>
						<Plus className="w-4 h-4 mr-2" />
						Novo Cargo
					</Button>
				)}
			</div>

			{isRolesLoading ? (
				<div className="flex justify-center py-8">
					<Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
				</div>
			) : scenarioRoles.length === 0 ? (
				<div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
					<Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
					<p className="text-gray-500">Nenhum cargo encontrado.</p>
				</div>
			) : (
				<div className="border rounded-lg overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Nome</TableHead>
								<TableHead>Descrição</TableHead>
								<TableHead>Permissões</TableHead>
								{canEdit && <TableHead className="w-[100px]"></TableHead>}
							</TableRow>
						</TableHeader>
						<TableBody>
							{scenarioRoles.map((role) => (
								<TableRow key={role.id}>
									<TableCell className="font-medium">{role.name}</TableCell>
									<TableCell>{role.description || "-"}</TableCell>
									<TableCell>
										<span className="text-xs text-gray-500">
											{role.resources?.length || 0} permissões
										</span>
									</TableCell>
									{canEdit && (
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="sm">
														<MoreHorizontal className="w-4 h-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() => handleEditRole(role)}
													>
														<Pencil className="w-4 h-4 mr-2" />
														Editar
													</DropdownMenuItem>
													<DropdownMenuItem
														className="text-red-600"
														onClick={() => handleDeleteRole(role)}
													>
														<Trash2 className="w-4 h-4 mr-2" />
														Excluir
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									)}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-2xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
					<DialogHeader>
						<DialogTitle>Gerenciar Cenários</DialogTitle>
						<DialogDescription>
							Crie e gerencie os cenários da sua instituição.
						</DialogDescription>
					</DialogHeader>

					<div className="mt-4">
						{viewMode === "list" && renderList()}
						{viewMode === "edit" && renderEdit()}
						{viewMode === "members" && renderMembers()}
						{viewMode === "roles" && renderRoles()}
					</div>
				</DialogContent>
			</Dialog>

			{selectedScenario && (
				<>
					<AssignUserScenarioDialog
						open={assignDialogOpen}
						onOpenChange={setAssignDialogOpen}
						tenantId={tenantId}
						scenarioId={selectedScenario.id}
						scenarioRoles={scenarioRoles}
						editingUser={editingMember}
						onSaved={() => {
							setAssignDialogOpen(false);
							setHasChanges(true);
							fetchMembers();
						}}
					/>
					<ScenarioRoleDialog
						open={roleDialogOpen}
						onOpenChange={setRoleDialogOpen}
						tenantId={tenantId}
						scenarioId={selectedScenario.id}
						editingRole={editingRole}
						onSaved={() => {
							setRoleDialogOpen(false);
							setHasChanges(true);
							fetchScenarioRoles();
						}}
						scope="tenant"
					/>
				</>
			)}

			<ConfirmationDialog
				open={deleteScenarioDialog.open}
				onOpenChange={(open) =>
					setDeleteScenarioDialog({ open, scenario: null })
				}
				onConfirm={confirmDeleteScenario}
				title="Excluir Cenário"
				description={`Tem certeza que deseja excluir o cenário "${deleteScenarioDialog.scenario?.name}"? Esta ação não pode ser desfeita.`}
				confirmText="Excluir"
				cancelText="Cancelar"
			/>

			<ConfirmationDialog
				open={removeMemberDialog.open}
				onOpenChange={(open) => setRemoveMemberDialog({ open, member: null })}
				onConfirm={confirmRemoveMember}
				title="Remover Usuário"
				description={`Tem certeza que deseja remover o usuário "${removeMemberDialog.member?.UserTenant.user.username}" deste cenário?`}
				confirmText="Remover"
				cancelText="Cancelar"
			/>

			<ConfirmationDialog
				open={deleteRoleDialog.open}
				onOpenChange={(open) => setDeleteRoleDialog({ open, role: null })}
				onConfirm={confirmDeleteRole}
				title="Excluir Cargo"
				description={`Tem certeza que deseja excluir o cargo "${deleteRoleDialog.role?.name}"? Esta ação não pode ser desfeita.`}
				confirmText="Excluir"
				cancelText="Cancelar"
			/>
		</>
	);
}

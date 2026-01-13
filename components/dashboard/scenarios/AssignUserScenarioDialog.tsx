"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

interface AvailableUser {
	id: string;
	user: {
		id: string;
		username: string;
		email: string;
	};
	TenantRole: {
		id: string;
		name: string;
	};
}

interface ScenarioRole {
	id: string;
	name: string;
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

interface AssignUserScenarioDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	tenantId: string;
	scenarioId: string;
	scenarioRoles: ScenarioRole[];
	editingUser: ScenarioUser | null;
	onSaved: () => void;
}

export function AssignUserScenarioDialog({
	open,
	onOpenChange,
	tenantId,
	scenarioId,
	scenarioRoles,
	editingUser,
	onSaved,
}: AssignUserScenarioDialogProps) {
	const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	const [selectedUserTenantId, setSelectedUserTenantId] = useState<string>("");
	const [selectedRoleId, setSelectedRoleId] = useState<string>("");

	// Busca usuários disponíveis (que não estão no cenário)
	const fetchAvailableUsers = useCallback(async () => {
		if (editingUser) {
			setIsLoading(false);
			return;
		}

		try {
			setIsLoading(true);
			const response = await apiService.fetchWithAuth<AvailableUser[]>(
				`/scenario-members/${scenarioId}/available`,
				{
					headers: {
						"x-tenant-id": tenantId,
					},
				}
			);
			if (response.data) {
				setAvailableUsers(response.data);
			}
		} catch (error) {
			console.error("Erro ao buscar usuários disponíveis:", error);
			toast.error("Não foi possível carregar os usuários disponíveis.");
		} finally {
			setIsLoading(false);
		}
	}, [tenantId, scenarioId, editingUser]);

	// Carrega dados ao abrir
	useEffect(() => {
		if (open) {
			fetchAvailableUsers();

			if (editingUser) {
				// Preenche campos para edição
				setSelectedUserTenantId(editingUser.userTenantId);
				setSelectedRoleId(editingUser.roleId);
			} else {
				// Reset campos para criação
				setSelectedUserTenantId("");
				setSelectedRoleId("");
			}
		}
	}, [open, editingUser, fetchAvailableUsers]);

	// Salva o usuário no cenário
	const handleSave = async () => {
		if (!selectedRoleId) {
			toast.error("Selecione um cargo para o usuário.");
			return;
		}

		if (!editingUser && !selectedUserTenantId) {
			toast.error("Selecione um usuário.");
			return;
		}

		try {
			setIsSaving(true);

			if (editingUser) {
				// Atualiza cargo do usuário
				await apiService.fetchWithAuth(`/scenario-members/${scenarioId}`, {
					method: "PUT",
					body: JSON.stringify({
						scenarioRoleId: selectedRoleId,
						userScenarioId: editingUser.id,
					}),
					headers: {
						"x-tenant-id": tenantId,
					},
				});
				toast.success("Cargo atualizado com sucesso.");
			} else {
				// Adiciona novo usuário ao cenário
				await apiService.fetchWithAuth("/scenario-members/assign", {
					method: "POST",
					body: JSON.stringify({
						scenarioId,
						userTenantId: selectedUserTenantId,
						scenarioRoleId: selectedRoleId,
						userEmail:
							availableUsers.find((u) => u.id === selectedUserTenantId)?.user
								.email || "",
					}),
					headers: {
						"x-tenant-id": tenantId,
					},
				});
				toast.success("Usuário adicionado ao cenário com sucesso.");
			}

			onSaved();
		} catch (error) {
			console.error("Erro ao salvar:", error);
			const message =
				error instanceof Error
					? error.message
					: editingUser
					? "Não foi possível atualizar o cargo."
					: "Não foi possível adicionar o usuário.";
			toast.error(message);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
				<DialogHeader>
					<DialogTitle>
						{editingUser ? "Editar Cargo" : "Adicionar Usuário"}
					</DialogTitle>
					<DialogDescription>
						{editingUser
							? "Altere o cargo do usuário neste cenário."
							: "Selecione um usuário e um cargo para adicionar ao cenário."}
					</DialogDescription>
				</DialogHeader>

				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
					</div>
				) : (
					<div className="space-y-4 py-4">
						{!editingUser && (
							<div className="space-y-2">
								<Label htmlFor="user">Usuário</Label>
								{availableUsers.length === 0 ? (
									<p className="text-sm text-gray-500 dark:text-gray-400">
										Nenhum usuário disponível. Todos os membros do tenant já
										estão neste cenário.
									</p>
								) : (
									<Select
										value={selectedUserTenantId}
										onValueChange={setSelectedUserTenantId}
									>
										<SelectTrigger>
											<SelectValue placeholder="Selecione um usuário" />
										</SelectTrigger>
										<SelectContent>
											{availableUsers.map((user) => (
												<SelectItem key={user.id} value={user.id}>
													<div className="flex flex-col text-left">
														<span>{user.user.username}</span>
														<span className="text-xs text-gray-500">
															{user.user.email}
														</span>
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							</div>
						)}

						{editingUser && (
							<div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
								<p className="text-sm font-medium text-gray-900 dark:text-gray-100">
									{editingUser.UserTenant.user.username}
								</p>
								<p className="text-xs text-gray-500 dark:text-gray-400">
									{editingUser.UserTenant.user.email}
								</p>
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="role">Cargo no Cenário</Label>
							{scenarioRoles.length === 0 ? (
								<p className="text-sm text-gray-500 dark:text-gray-400">
									Nenhum cargo encontrado para este cenário. Crie cargos
									primeiro.
								</p>
							) : (
								<Select
									value={selectedRoleId}
									onValueChange={setSelectedRoleId}
								>
									<SelectTrigger>
										<SelectValue placeholder="Selecione um cargo" />
									</SelectTrigger>
									<SelectContent>
										{scenarioRoles.map((role) => (
											<SelectItem key={role.id} value={role.id}>
												{role.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</div>
					</div>
				)}

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isSaving}
					>
						Cancelar
					</Button>
					<Button
						onClick={handleSave}
						disabled={
							isSaving ||
							isLoading ||
							(!editingUser && availableUsers.length === 0) ||
							scenarioRoles.length === 0
						}
						className="bg-emerald-600 hover:bg-emerald-700"
					>
						{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
						{editingUser ? "Salvar" : "Adicionar"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

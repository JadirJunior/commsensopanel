"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ScenarioRole {
	id: string;
	name: string;
}

interface ScenarioUser {
	id: string;
	UserTenant: {
		user: {
			email: string;
			username: string;
		};
	};
	ScenarioRole: {
		id: string;
	};
}

interface ScenarioUserDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	scenarioId: string;
	tenantId: string;
	editingUser: ScenarioUser | null;
	onSaved: () => void;
}

export function ScenarioUserDialog({
	open,
	onOpenChange,
	tenantId,
	scenarioId,
	editingUser,
	onSaved,
}: ScenarioUserDialogProps) {
	const [email, setEmail] = useState("");
	const [selectedRoleId, setSelectedRoleId] = useState("");
	const [roles, setRoles] = useState<ScenarioRole[]>([]);
	const [isLoadingRoles, setIsLoadingRoles] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (open) {
			fetchRoles();
			if (editingUser) {
				setEmail(editingUser.UserTenant.user.email);
				setSelectedRoleId(editingUser.ScenarioRole.id);
			} else {
				setEmail("");
				setSelectedRoleId("");
			}
		}
	}, [open, editingUser]);

	const fetchRoles = async () => {
		try {
			setIsLoadingRoles(true);
			const response = await apiService.fetchWithAuth<ScenarioRole[]>(
				`/scenario/${scenarioId}/roles`,
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
			setIsLoadingRoles(false);
		}
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!selectedRoleId) {
			toast.error("Selecione um cargo.");
			return;
		}

		if (!editingUser && !email) {
			toast.error("Informe o e-mail do usuário.");
			return;
		}

		try {
			setIsSaving(true);

			if (editingUser) {
				// Editar
				await apiService.fetchWithAuth(`/scenario-members/${editingUser.id}`, {
					method: "PUT",
					headers: {
						"x-tenant-id": tenantId,
						"x-scenario-id": scenarioId,
					},
					body: JSON.stringify({
						scenarioRoleId: selectedRoleId,
						scenarioId: scenarioId,
					}),
				});
				toast.success("Usuário atualizado com sucesso.");
			} else {
				// Criar
				await apiService.fetchWithAuth("/scenario-members/assign", {
					method: "POST",
					headers: {
						"x-tenant-id": tenantId,
						"x-scenario-id": scenarioId,
					},
					body: JSON.stringify({
						userEmail: email,
						scenarioRoleId: selectedRoleId,
						scenarioId: scenarioId,
					}),
				});
				toast.success("Usuário adicionado com sucesso.");
			}

			onSaved();
		} catch (error) {
			console.error("Erro ao salvar usuário:", error);
			const message =
				error instanceof Error ? error.message : "Erro ao salvar usuário.";
			toast.error(message);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
				<DialogHeader>
					<DialogTitle>
						{editingUser ? "Editar Usuário" : "Adicionar Usuário"}
					</DialogTitle>
					<DialogDescription>
						{editingUser
							? "Altere o cargo do usuário no cenário."
							: "Adicione um usuário existente ao cenário pelo e-mail."}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSave} className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="email">E-mail do Usuário</Label>
						<Input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="usuario@exemplo.com"
							disabled={!!editingUser}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="role">Cargo</Label>
						<Select
							value={selectedRoleId}
							onValueChange={setSelectedRoleId}
							disabled={isLoadingRoles}
						>
							<SelectTrigger>
								<SelectValue
									placeholder={
										isLoadingRoles ? "Carregando..." : "Selecione um cargo"
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{roles.map((role) => (
									<SelectItem key={role.id} value={role.id}>
										{role.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSaving}
						>
							Cancelar
						</Button>
						<Button
							type="submit"
							disabled={isSaving || isLoadingRoles}
							className="bg-emerald-600 hover:bg-emerald-700"
						>
							{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
							Salvar
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

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
import { Textarea } from "@/components/ui/textarea";
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
import { permissionsByScope } from "@/types/permissions";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ScenarioRole {
	id: string;
	name: string;
	description?: string;
	resources: string[];
}

interface ScenarioRoleDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	scenarioId?: string;
	tenantId: string;
	editingRole: ScenarioRole | null;
	onSaved: () => void;
	scope?: "tenant" | "scenario";
}

const ACCESS_LEVELS = [
	{ value: "none", label: "Sem Acesso" },
	{ value: "view", label: "Visualizar" },
	{ value: "edit", label: "Editar" },
	{ value: "all", label: "Controle Total" },
];

export function ScenarioRoleDialog({
	open,
	onOpenChange,
	tenantId,
	scenarioId,
	editingRole,
	onSaved,
	scope = "scenario",
}: ScenarioRoleDialogProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [permissions, setPermissions] = useState<Record<string, string>>({});
	const [isSaving, setIsSaving] = useState(false);

	const resourcesList = permissionsByScope["scenario"] || [];

	useEffect(() => {
		if (open) {
			if (editingRole) {
				setName(editingRole.name);
				setDescription(editingRole.description || "");

				const initialPermissions: Record<string, string> = {};
				resourcesList.forEach((r) => (initialPermissions[r] = "none"));

				editingRole.resources.forEach((perm) => {
					const [scopeRaw, rest] = perm.split(":");
					if (scopeRaw === scope && rest) {
						const [resource, action] = rest.split("-");
						if (resource && action) {
							initialPermissions[resource] = action;
						}
					}
				});
				setPermissions(initialPermissions);
			} else {
				setName("");
				setDescription("");
				const initialPermissions: Record<string, string> = {};
				resourcesList.forEach((r) => (initialPermissions[r] = "none"));
				setPermissions(initialPermissions);
			}
		}
	}, [open, editingRole, scope, resourcesList]);

	const handlePermissionChange = (resource: string, value: string) => {
		setPermissions((prev) => ({
			...prev,
			[resource]: value,
		}));
	};

	const handleSave = async () => {
		if (!name.trim()) {
			toast.error("O nome do cargo é obrigatório.");
			return;
		}

		try {
			setIsSaving(true);

			// Convert permissions map back to array of strings
			const resources = Object.entries(permissions).map(
				([resource, action]) => `scenario:${resource}-${action}`
			);

			const payload: any = {
				name,
				description,
				resources,
			};

			if (scope === "scenario") {
				payload.scenarioId = scenarioId;
			}

			const headers: Record<string, string> = {
				"x-tenant-id": tenantId,
			};

			if (scope === "scenario" && scenarioId) {
				headers["x-scenario-id"] = scenarioId;
			}

			const endpoint =
				scope === "tenant"
					? `/scenario/${scenarioId}/roles`
					: "/scenario/roles";

			if (editingRole) {
				await apiService.fetchWithAuth(`${endpoint}/${editingRole.id}`, {
					method: "PUT",
					body: JSON.stringify(payload),
					headers,
				});
				toast.success("Cargo atualizado com sucesso!");
			} else {
				await apiService.fetchWithAuth(endpoint, {
					method: "POST",
					body: JSON.stringify(payload),
					headers,
				});
				toast.success("Cargo criado com sucesso!");
			}

			onSaved();
			onOpenChange(false);
		} catch (error) {
			console.error("Erro ao salvar cargo:", error);
			toast.error("Erro ao salvar o cargo. Verifique as permissões.");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
				<DialogHeader>
					<DialogTitle>
						{editingRole ? "Editar Cargo" : "Novo Cargo"}
					</DialogTitle>
					<DialogDescription>
						Defina o nome e as permissões para este cargo no cenário
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4 flex-1 overflow-hidden">
					<div className="grid gap-2">
						<Label htmlFor="name">Nome do Cargo</Label>
						<Input
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Ex: Operador, Supervisor"
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="description">Descrição</Label>
						<Textarea
							id="description"
							value={description}
							className="text-black "
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Descrição opcional do cargo"
						/>
					</div>

					<div className="flex-1 overflow-hidden flex flex-col min-h-[200px]">
						<Label className="mb-2">Permissões</Label>
						<div className="border rounded-md flex-1 overflow-hidden">
							<ScrollArea className="h-[300px] p-4">
								<div className="space-y-4">
									{resourcesList.map((resource) => (
										<div
											key={resource}
											className="flex items-center justify-between py-2 border-b last:border-0"
										>
											<span className="text-sm font-medium capitalize">
												{resource.replace(/_/g, " ")}
											</span>
											<Select
												value={permissions[resource] || "none"}
												onValueChange={(value) =>
													handlePermissionChange(resource, value)
												}
											>
												<SelectTrigger className="w-[180px]">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{ACCESS_LEVELS.map((level) => (
														<SelectItem key={level.value} value={level.value}>
															{level.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									))}
								</div>
							</ScrollArea>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isSaving}
					>
						Cancelar
					</Button>
					<Button onClick={handleSave} disabled={isSaving}>
						{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Salvar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

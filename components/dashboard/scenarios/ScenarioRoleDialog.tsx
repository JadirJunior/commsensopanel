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

interface ScenarioRole {
	id: string;
	name: string;
	description: string;
	resources: string[];
	scenarioId: string;
}

interface ScenarioRoleDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	tenantId: string;
	scenarioId: string;
	editingRole: ScenarioRole | null;
	onSaved: () => void;
}

const RESOURCES = [
	{ id: "device", label: "Dispositivos" },
	{ id: "sensor_rule", label: "Regras de Sensor" },
	{ id: "spot", label: "Spots" },
	{ id: "measurement", label: "Medições" },
	{ id: "image_generation", label: "Geração de Imagem" },
	{ id: "user", label: "Usuários" },
	{ id: "role", label: "Cargos" },
];

const LEVELS = [
	{ value: "none", label: "Nenhum" },
	{ value: "view", label: "Visualizar" },
	{ value: "edit", label: "Editar" },
	{ value: "all", label: "Total" },
];

const startingPermissions = RESOURCES.map(
	(resource) => `scenario:${resource.id}-none`
);
export function ScenarioRoleDialog({
	open,
	onOpenChange,
	tenantId,
	scenarioId,
	editingRole,
	onSaved,
}: ScenarioRoleDialogProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (open) {
			if (editingRole) {
				setName(editingRole.name);
				setDescription(editingRole.description || "");
				setSelectedPermissions(editingRole.resources || []);
			} else {
				setName("");
				setDescription("");
				setSelectedPermissions(startingPermissions);
			}
		}
	}, [open, editingRole]);

	const getPermissionLevel = (resourceId: string) => {
		const relevantPerms = selectedPermissions.filter((p) =>
			p.startsWith(`scenario:${resourceId}-`)
		);
		if (relevantPerms.some((p) => p.endsWith("-all"))) return "all";
		if (relevantPerms.some((p) => p.endsWith("-edit"))) return "edit";
		if (relevantPerms.some((p) => p.endsWith("-view"))) return "view";
		return "none";
	};

	const handleLevelChange = (resourceId: string, level: string) => {
		// Remove permissões existentes para este recurso
		const newPerms = selectedPermissions.filter(
			(p) => !p.startsWith(`scenario:${resourceId}-`)
		);

		newPerms.push(`scenario:${resourceId}-${level}`);

		setSelectedPermissions(newPerms);
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name) {
			toast.error("O nome do cargo é obrigatório.");
			return;
		}

		try {
			setIsSaving(true);

			const payload = {
				name,
				description,
				resources: selectedPermissions,
			};

			console.log("Payload to save scenario role:", payload);

			if (editingRole) {
				await apiService.fetchWithAuth(
					`/scenario/${scenarioId}/roles/${editingRole.id}`,
					{
						method: "PUT",
						body: JSON.stringify(payload),
						headers: {
							"x-tenant-id": tenantId,
						},
					}
				);
				toast.success("Cargo atualizado com sucesso.");
			} else {
				await apiService.fetchWithAuth(`/scenario/${scenarioId}/roles`, {
					method: "POST",
					body: JSON.stringify(payload),
					headers: {
						"x-tenant-id": tenantId,
					},
				});
				toast.success("Cargo criado com sucesso.");
			}

			onSaved();
		} catch (error) {
			// console.error("Erro ao salvar cargo:", error);
			const message =
				error instanceof Error
					? error.message
					: "Não foi possível salvar o cargo.";
			toast.error(message);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
				<DialogHeader>
					<DialogTitle>
						{editingRole ? "Editar Cargo" : "Novo Cargo"}
					</DialogTitle>
					<DialogDescription>
						Defina o nome e as permissões deste cargo no cenário.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSave} className="space-y-4 py-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="name">Nome do Cargo</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Ex: Operador"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="description">Descrição</Label>
							<Input
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Descrição opcional"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label>Permissões</Label>
						<div className="border rounded-md p-4 space-y-4 bg-gray-50 dark:bg-gray-800/50">
							{RESOURCES.map((resource) => (
								<div
									key={resource.id}
									className="flex items-center justify-between"
								>
									<Label className="text-base font-medium">
										{resource.label}
									</Label>
									<Select
										value={getPermissionLevel(resource.id)}
										onValueChange={(value) =>
											handleLevelChange(resource.id, value)
										}
									>
										<SelectTrigger className="w-[180px] bg-background text-foreground border-input cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors">
											<SelectValue placeholder="Selecione o nível" />
										</SelectTrigger>
										<SelectContent className="bg-popover text-popover-foreground border-border">
											{LEVELS.map((level) => (
												<SelectItem
													key={level.value}
													value={level.value}
													className="cursor-pointer focus:bg-primary focus:text-primary-foreground"
												>
													{level.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							))}
						</div>
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
							disabled={isSaving}
							className="bg-emerald-600 hover:bg-emerald-700"
						>
							{isSaving ? "Salvando..." : "Salvar"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

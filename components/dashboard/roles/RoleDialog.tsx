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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { RoleModel } from "@/types/auth";

interface RoleDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (role: Partial<RoleModel>) => Promise<void>;
	role?: RoleModel;
	isLoading?: boolean;
}

const RESOURCES = [
	{ id: "scenario", label: "Cenários" },
	{ id: "user", label: "Usuários" },
	{ id: "role", label: "Cargos" },
];

const LEVELS = [
	{ value: "none", label: "Nenhum" },
	{ value: "view", label: "Visualizar" },
	{ value: "edit", label: "Editar" },
	{ value: "all", label: "Total" },
];

export function RoleDialog({
	isOpen,
	onClose,
	onSave,
	role,
	isLoading = false,
}: RoleDialogProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

	useEffect(() => {
		if (role) {
			setName(role.name);
			setDescription(role.description);
			setSelectedPermissions(role.permissions || []);
		} else {
			setName("");
			setDescription("");
			setSelectedPermissions([]);
		}
	}, [role, isOpen]);

	const getPermissionLevel = (resourceId: string) => {
		const relevantPerms = selectedPermissions.filter((p) =>
			p.startsWith(`tenant:${resourceId}-`)
		);
		if (relevantPerms.some((p) => p.endsWith("-all"))) return "all";
		if (relevantPerms.some((p) => p.endsWith("-edit"))) return "edit";
		if (relevantPerms.some((p) => p.endsWith("-view"))) return "view";
		return "none";
	};

	const handleLevelChange = (resourceId: string, level: string) => {
		// Remove permissões existentes para este recurso
		const newPerms = selectedPermissions.filter(
			(p) => !p.startsWith(`tenant:${resourceId}-`)
		);

		// Sempre adiciona a permissão, incluindo "none" para indicar explicitamente a remoção
		newPerms.push(`tenant:${resourceId}-${level}`);

		setSelectedPermissions(newPerms);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await onSave({
			id: role?.id,
			name,
			description,
			permissions: selectedPermissions,
		});
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
				<DialogHeader>
					<DialogTitle>{role ? "Editar Cargo" : "Novo Cargo"}</DialogTitle>
					<DialogDescription>
						{role
							? "Edite as informações e permissões do cargo."
							: "Crie um novo cargo e defina suas permissões."}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="name">Nome</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Ex: Administrador"
								required
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="description">Descrição</Label>
							<Input
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Descrição das responsabilidades"
							/>
						</div>
						<div className="grid gap-2">
							<Label>Permissões</Label>
							<div className="border rounded-md p-4 space-y-4">
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
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isLoading}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={isLoading}>
							{isLoading ? "Salvando..." : "Salvar"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
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
} from "lucide-react";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { useVerifyPermissions } from "@/components/rbac";
import { TENANT_PERMISSIONS } from "@/constants/permissions";

interface Scenario {
	id: string;
	name: string;
	slug: string;
	tenantId: string;
}

interface ScenariosManagementDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	tenantId: string;
}

export function ScenariosManagementDialog({
	open,
	onOpenChange,
	tenantId,
}: ScenariosManagementDialogProps) {
	const { can } = useVerifyPermissions({
		scope: "tenant",
		tenantId,
	});
	const canEdit = can(TENANT_PERMISSIONS.SCENARIO_EDIT);
	const canDelete = can(TENANT_PERMISSIONS.SCENARIO_ALL);

	const [scenarios, setScenarios] = useState<Scenario[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [viewMode, setViewMode] = useState<"list" | "edit" | "members">("list");
	const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(
		null
	);
	const [formData, setFormData] = useState({ name: "", slug: "" });
	const [isSaving, setIsSaving] = useState(false);

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
		}
	}, [open, fetchScenarios]);

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
			fetchScenarios();
			setViewMode("list");
		} catch (error) {
			console.error("Erro ao salvar cenário:", error);
			toast.error("Não foi possível salvar o cenário.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async (scenario: Scenario) => {
		if (!confirm("Tem certeza que deseja excluir este cenário?")) return;

		try {
			await apiService.fetchWithAuth(`/scenario/${scenario.id}`, {
				method: "DELETE",
				headers: {
					"x-tenant-id": tenantId,
				},
			});
			toast.success("Cenário excluído com sucesso.");
			fetchScenarios();
		} catch (error) {
			console.error("Erro ao excluir cenário:", error);
			toast.error("Não foi possível excluir o cenário.");
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
												<DropdownMenuItem onClick={() => handleEdit(scenario)}>
													<Pencil className="w-4 h-4 mr-2" />
													Editar
												</DropdownMenuItem>
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
			<div className="flex items-center gap-4 mb-4">
				<Button variant="ghost" size="icon" onClick={() => setViewMode("list")}>
					<ArrowLeft className="w-4 h-4" />
				</Button>
				<div>
					<h3 className="text-lg font-medium">Membros do Cenário</h3>
					<p className="text-sm text-gray-500">{selectedScenario?.name}</p>
				</div>
			</div>

			<div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
				<Users className="w-8 h-8 text-yellow-600 dark:text-yellow-500 mx-auto mb-2" />
				<h4 className="font-medium text-yellow-800 dark:text-yellow-200">
					Gerenciamento de Membros
				</h4>
				<p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
					Esta funcionalidade está em desenvolvimento. Em breve você poderá
					adicionar e remover usuários deste cenário.
				</p>
			</div>

			{/* Placeholder visual para a lista de membros */}
			<div className="opacity-50 pointer-events-none select-none filter blur-[1px]">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Usuário</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Cargo</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						<TableRow>
							<TableCell>Exemplo Usuário</TableCell>
							<TableCell>usuario@exemplo.com</TableCell>
							<TableCell>Operador</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Admin Exemplo</TableCell>
							<TableCell>admin@exemplo.com</TableCell>
							<TableCell>Administrador</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</div>
		</div>
	);

	return (
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
				</div>
			</DialogContent>
		</Dialog>
	);
}

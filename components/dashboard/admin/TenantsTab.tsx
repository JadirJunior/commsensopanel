"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	MoreHorizontal,
	Plus,
	Pencil,
	Trash2,
	Building2,
	Users,
	LayoutDashboard,
	Loader2,
	Search,
	AlertTriangle,
	UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { apiService } from "@/lib/api";

interface Tenant {
	id: string;
	name: string;
	slug: string;
	description?: string;
	Users?: Array<{ id: string }>;
	Scenarios?: Array<{ id: string }>;
	Roles?: Array<{ id: string }>;
	createdAt?: string;
}

interface TenantFormData {
	name: string;
	slug: string;
	description?: string;
	// Dados do usuário inicial (apenas para criação)
	initialUserEmail?: string;
}

const initialFormData: TenantFormData = {
	name: "",
	slug: "",
	description: "",
	initialUserEmail: "",
};

export function TenantsTab() {
	const [tenants, setTenants] = useState<Tenant[]>([]);
	const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
	const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
	const [formData, setFormData] = useState<TenantFormData>(initialFormData);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Carregar tenants
	const loadTenants = useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await apiService.fetchWithAuth<Tenant[]>("/tenant", {
				method: "GET",
			});
			if (response.data) {
				setTenants(response.data);
				setFilteredTenants(response.data);
			}
		} catch (error) {
			toast.error("Erro ao carregar instituições");
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadTenants();
	}, [loadTenants]);

	// Filtrar tenants
	useEffect(() => {
		if (!searchTerm.trim()) {
			setFilteredTenants(tenants);
			return;
		}

		const term = searchTerm.toLowerCase();
		const filtered = tenants.filter(
			(tenant) =>
				tenant.name.toLowerCase().includes(term) ||
				tenant.slug.toLowerCase().includes(term)
		);
		setFilteredTenants(filtered);
	}, [searchTerm, tenants]);

	// Gerar slug automaticamente
	const generateSlug = (name: string) => {
		return name
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "")
			.substring(0, 50);
	};

	// Handlers
	const handleOpenCreate = () => {
		setEditingTenant(null);
		setFormData(initialFormData);
		setIsDialogOpen(true);
	};

	const handleOpenEdit = (tenant: Tenant) => {
		setEditingTenant(tenant);
		setFormData({
			name: tenant.name,
			slug: tenant.slug,
			description: tenant.description || "",
		});
		setIsDialogOpen(true);
	};

	const handleOpenDelete = (tenant: Tenant) => {
		setDeletingTenant(tenant);
		setIsDeleteDialogOpen(true);
	};

	const handleNameChange = (name: string) => {
		setFormData((prev) => ({
			...prev,
			name,
			// Auto-gerar slug apenas na criação e se não foi editado manualmente
			...(!editingTenant && { slug: generateSlug(name) }),
		}));
	};

	const handleSave = async () => {
		if (!formData.name.trim()) {
			toast.error("Nome é obrigatório");
			return;
		}

		if (!formData.slug.trim()) {
			toast.error("Slug é obrigatório");
			return;
		}

		// Validar slug (apenas letras minúsculas, números e hífens)
		if (!/^[a-z0-9-]+$/.test(formData.slug)) {
			toast.error(
				"Slug deve conter apenas letras minúsculas, números e hífens"
			);
			return;
		}

		setIsSubmitting(true);

		try {
			if (editingTenant) {
				// Atualizar tenant existente
				const response = await apiService.fetchWithAuth<Tenant>(
					`/tenant/${editingTenant.id}`,
					{
						method: "PUT",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							name: formData.name,
							slug: formData.slug,
						}),
					}
				);

				if (response.success) {
					toast.success("Instituição atualizada com sucesso!");
					setIsDialogOpen(false);
					loadTenants();
				} else {
					toast.error(response.message || "Erro ao atualizar instituição");
				}
			} else {
				// Criar novo tenant
				const createData: {
					name: string;
					slug: string;
					initialUserEmail?: string;
				} = {
					name: formData.name,
					slug: formData.slug,
				};

				// Adicionar email do usuário inicial se fornecido
				if (formData.initialUserEmail?.trim()) {
					createData.initialUserEmail = formData.initialUserEmail.trim();
				}

				const response = await apiService.fetchWithAuth<Tenant>("/tenant", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(createData),
				});

				if (response.success) {
					const successMessage = formData.initialUserEmail?.trim()
						? "Instituição criada com sucesso! Um cargo de administrador foi criado e o usuário foi vinculado."
						: "Instituição criada com sucesso! Um cargo de administrador padrão foi criado.";
					toast.success(successMessage);
					setIsDialogOpen(false);
					loadTenants();
				} else {
					toast.error(response.message || "Erro ao criar instituição");
				}
			}
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : "Erro ao salvar instituição";
			toast.error(errorMessage);
			console.error(error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!deletingTenant) return;

		setIsSubmitting(true);

		try {
			const response = await apiService.fetchWithAuth<void>(
				`/tenant/${deletingTenant.id}`,
				{
					method: "DELETE",
				}
			);

			if (response.success) {
				toast.success("Instituição excluída com sucesso!");
				setIsDeleteDialogOpen(false);
				setDeletingTenant(null);
				loadTenants();
			} else {
				toast.error(response.message || "Erro ao excluir instituição");
			}
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : "Erro ao excluir instituição";
			toast.error(errorMessage);
			console.error(error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
						Instituições Cadastradas
					</h3>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Visualize e gerencie as instituições do sistema
					</p>
				</div>
				<Button onClick={handleOpenCreate} className="gap-2">
					<Plus className="w-4 h-4" />
					Nova Instituição
				</Button>
			</div>

			{/* Loading */}
			{isLoading && (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
				</div>
			)}

			{/* Table */}
			{!isLoading && filteredTenants.length > 0 && (
				<div className="rounded-md border border-slate-700/50 overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-b border-slate-700/50">
								<TableHead className="text-slate-300 font-semibold">
									Instituição
								</TableHead>
								<TableHead className="text-slate-300 font-semibold">
									Slug
								</TableHead>
								<TableHead className="text-slate-300 font-semibold text-center">
									Usuários
								</TableHead>
								<TableHead className="text-slate-300 font-semibold text-center">
									Cenários
								</TableHead>
								<TableHead className="text-slate-300 font-semibold text-center">
									Cargos
								</TableHead>
								<TableHead className="text-slate-300 font-semibold text-right">
									Ações
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredTenants.map((tenant) => (
								<TableRow
									key={tenant.id}
									className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
								>
									<TableCell>
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
												<Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
											</div>
											<div>
												<p className="font-medium text-white">{tenant.name}</p>
												{tenant.description && (
													<p className="text-sm text-slate-400">
														{tenant.description}
													</p>
												)}
											</div>
										</div>
									</TableCell>
									<TableCell>
										<Badge variant="outline" className="font-mono text-xs">
											{tenant.slug}
										</Badge>
									</TableCell>
									<TableCell className="text-center">
										<div className="flex items-center justify-center gap-1 text-slate-300">
											<Users className="w-4 h-4 text-slate-400" />
											{tenant.Users?.length || 0}
										</div>
									</TableCell>
									<TableCell className="text-center">
										<div className="flex items-center justify-center gap-1 text-slate-300">
											<LayoutDashboard className="w-4 h-4 text-slate-400" />
											{tenant.Scenarios?.length || 0}
										</div>
									</TableCell>
									<TableCell className="text-center">
										<div className="flex items-center justify-center gap-1 text-slate-300">
											{tenant.Roles?.length || 0}
										</div>
									</TableCell>
									<TableCell className="text-right">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700/50"
												>
													<MoreHorizontal className="w-4 h-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuLabel>Ações</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													onClick={() => handleOpenEdit(tenant)}
												>
													<Pencil className="w-4 h-4 mr-2" />
													Editar
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													className="text-red-600 dark:text-red-400"
													onClick={() => handleOpenDelete(tenant)}
												>
													<Trash2 className="w-4 h-4 mr-2" />
													Excluir
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{/* Empty state */}
			{!isLoading && filteredTenants.length === 0 && (
				<div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
					<Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
					<p className="text-gray-500 dark:text-gray-400 mt-1 mb-4">
						Crie a primeira instituição do sistema
					</p>
					<Button onClick={handleOpenCreate}>
						<Plus className="w-4 h-4 mr-2" />
						Criar Instituição
					</Button>
				</div>
			)}

			{/* Create/Edit Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Building2 className="w-5 h-5 text-blue-500" />
							{editingTenant ? "Editar Instituição" : "Nova Instituição"}
						</DialogTitle>
						<DialogDescription>
							{editingTenant
								? "Atualize os dados da instituição"
								: "Preencha os dados para criar uma nova instituição"}
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="name">Nome da Instituição *</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) => handleNameChange(e.target.value)}
								placeholder="Ex: Universidade Federal de Santa Catarina"
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="slug">Slug *</Label>
							<Input
								id="slug"
								value={formData.slug}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										slug: e.target.value.toLowerCase(),
									}))
								}
								placeholder="Ex: ufsc"
								className="font-mono"
							/>
							<p className="text-xs text-slate-400">
								Identificador único usado em URLs. Apenas letras minúsculas,
								números e hífens.
							</p>
						</div>

						{/* Separador para usuário inicial - apenas na criação */}
						{!editingTenant && (
							<>
								<div className="relative my-2">
									<div className="absolute inset-0 flex items-center">
										<span className="w-full border-t border-slate-700" />
									</div>
									<div className="relative flex justify-center text-xs uppercase">
										<span className="bg-background px-2 text-slate-400 flex items-center gap-1">
											<UserPlus className="w-3 h-3" />
											Usuário Inicial (opcional)
										</span>
									</div>
								</div>

								<p className="text-xs text-slate-400 -mt-2">
									Adicione um usuário como administrador inicial desta
									instituição. O usuário deve já estar cadastrado no sistema.
								</p>

								<div className="grid gap-2">
									<Label htmlFor="initialUserEmail">Email do Usuário</Label>
									<Input
										id="initialUserEmail"
										type="email"
										value={formData.initialUserEmail}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												initialUserEmail: e.target.value,
											}))
										}
										placeholder="usuario@email.com"
									/>
								</div>
							</>
						)}
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsDialogOpen(false)}
							disabled={isSubmitting}
						>
							Cancelar
						</Button>
						<Button onClick={handleSave} disabled={isSubmitting}>
							{isSubmitting && (
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							)}
							{editingTenant ? "Salvar" : "Criar"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent className="sm:max-w-[400px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-red-500">
							<AlertTriangle className="w-5 h-5" />
							Confirmar Exclusão
						</DialogTitle>
						<DialogDescription>
							Tem certeza que deseja excluir a instituição{" "}
							<strong>{deletingTenant?.name}</strong>?
						</DialogDescription>
					</DialogHeader>

					<div className="py-4">
						<div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
							<p className="text-sm text-red-400">
								<strong>Atenção:</strong> Esta ação não pode ser desfeita. A
								instituição só poderá ser excluída se não houver usuários
								vinculados a ela.
							</p>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setIsDeleteDialogOpen(false);
								setDeletingTenant(null);
							}}
							disabled={isSubmitting}
						>
							Cancelar
						</Button>
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={isSubmitting}
						>
							{isSubmitting && (
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							)}
							Excluir
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

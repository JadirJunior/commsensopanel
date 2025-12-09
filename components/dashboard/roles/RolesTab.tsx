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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
	MoreHorizontal,
	Plus,
	Pencil,
	Trash2,
	Shield,
	Loader2,
} from "lucide-react";
import { RoleModel } from "@/types/auth";
import { apiService } from "@/lib/api";
import { RoleDialog } from "./RoleDialog";
import { toast } from "sonner";
import { formatPermission } from "@/lib/utils";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useVerifyPermissions } from "@/components/rbac";
import { TENANT_PERMISSIONS } from "@/constants/permissions";

interface RolesTabProps {
	tenantId: string;
}

export function RolesTab({ tenantId }: RolesTabProps) {
	const { can } = useVerifyPermissions({
		scope: "tenant",
		tenantId,
	});
	const canEdit = can(TENANT_PERMISSIONS.ROLE_EDIT);

	const [roles, setRoles] = useState<RoleModel[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingRole, setEditingRole] = useState<RoleModel | undefined>(
		undefined
	);
	const [isSaving, setIsSaving] = useState(false);
	const [roleToDelete, setRoleToDelete] = useState<RoleModel | null>(null);

	const fetchRoles = useCallback(async () => {
		try {
			setIsLoading(true);
			const response = await apiService.fetchWithAuth<RoleModel[]>(
				"/tenant/roles",
				{
					headers: {
						"x-tenant-id": tenantId,
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
	}, [tenantId]);

	useEffect(() => {
		fetchRoles();
	}, [fetchRoles]);

	const handleCreate = () => {
		setEditingRole(undefined);
		setIsDialogOpen(true);
	};

	const handleEdit = (role: RoleModel) => {
		setEditingRole(role);
		setIsDialogOpen(true);
	};

	const handleDeleteClick = (role: RoleModel) => {
		setRoleToDelete(role);
	};

	const handleSave = async (roleData: Partial<RoleModel>) => {
		try {
			setIsSaving(true);
			if (editingRole) {
				await apiService.fetchWithAuth(`/tenant/roles/${editingRole.id}`, {
					method: "PUT",
					body: JSON.stringify(roleData),
					headers: {
						"x-tenant-id": tenantId,
					},
				});
				toast.success("Cargo atualizado com sucesso.");
			} else {
				await apiService.fetchWithAuth("/tenant/roles", {
					method: "POST",
					body: JSON.stringify(roleData),
					headers: {
						"x-tenant-id": tenantId,
					},
				});
				toast.success("Cargo criado com sucesso.");
			}
			setIsDialogOpen(false);
			fetchRoles();
		} catch (error) {
			console.error("Erro ao salvar cargo:", error);
			toast.error("Não foi possível salvar o cargo.");
		} finally {
			setIsSaving(false);
		}
	};

	const confirmDelete = async () => {
		if (!roleToDelete) return;

		try {
			await apiService.fetchWithAuth(`/tenant/roles/${roleToDelete.id}`, {
				method: "DELETE",
				headers: {
					"x-tenant-id": tenantId,
				},
			});
			toast.success("Cargo removido com sucesso.");
			fetchRoles();
		} catch (error) {
			console.error("Erro ao remover cargo:", error);
			toast.error("Não foi possível remover o cargo.");
		} finally {
			setRoleToDelete(null);
		}
	};

	if (isLoading) {
		return (
			<div className="flex justify-center items-center py-12">
				<Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<div>
					<h3 className="text-lg font-medium">Cargos e Permissões</h3>
					<p className="text-sm text-muted-foreground">
						Gerencie os cargos e níveis de acesso da instituição.
					</p>
				</div>
				{canEdit && (
					<Button onClick={handleCreate} className="gap-2">
						<Plus className="w-4 h-4" />
						Novo Cargo
					</Button>
				)}
			</div>

			<div className="border rounded-md">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nome</TableHead>
							<TableHead>Descrição</TableHead>
							<TableHead>Permissões</TableHead>
							<TableHead className="w-20"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{roles.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={4}
									className="text-center py-8 text-muted-foreground"
								>
									Nenhum cargo encontrado.
								</TableCell>
							</TableRow>
						) : (
							roles.map((role) => (
								<TableRow
									key={role.id}
									className="hover:bg-primary/10 transition-colors"
								>
									<TableCell className="font-semibold text-white">
										<div className="flex items-center gap-2">
											<Shield className="w-4 h-4 text-emerald-400" />
											{role.name}
										</div>
									</TableCell>
									<TableCell className="text-slate-300">
										{role.description}
									</TableCell>
									<TableCell>
										<div className="flex flex-wrap gap-1">
											{role.permissions?.slice(0, 3).map((perm) => (
												<Badge
													key={perm}
													variant="outline"
													className="text-xs border-emerald-500/50 text-emerald-300 bg-emerald-950/50"
												>
													{formatPermission(perm)}
												</Badge>
											))}
											{role.permissions && role.permissions.length > 3 && (
												<Badge
													variant="outline"
													className="text-xs text-slate-400 border-slate-600"
												>
													+{role.permissions.length - 3}
												</Badge>
											)}
										</div>
									</TableCell>
									<TableCell>
										{canEdit && (
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
													>
														<span className="sr-only">Abrir menu</span>
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuLabel>Ações</DropdownMenuLabel>
													<DropdownMenuItem
														onClick={() => handleEdit(role)}
														className="cursor-pointer"
													>
														<Pencil className="mr-2 h-4 w-4" />
														Editar
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														className="text-red-600 cursor-pointer"
														onClick={() => handleDeleteClick(role)}
													>
														<Trash2 className="mr-2 h-4 w-4" />
														Excluir
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										)}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			<RoleDialog
				isOpen={isDialogOpen}
				onClose={() => setIsDialogOpen(false)}
				onSave={handleSave}
				role={editingRole}
				isLoading={isSaving}
			/>

			<Dialog
				open={!!roleToDelete}
				onOpenChange={(open) => !open && setRoleToDelete(null)}
			>
				<DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
					<DialogHeader>
						<DialogTitle>Você tem certeza?</DialogTitle>
						<DialogDescription>
							Esta ação não pode ser desfeita. Isso excluirá permanentemente o
							cargo <strong>{roleToDelete?.name}</strong> e removerá as
							permissões de todos os usuários associados.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setRoleToDelete(null)}>
							Cancelar
						</Button>
						<Button variant="destructive" onClick={confirmDelete}>
							Excluir
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

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
	UserCircle,
	Loader2,
	Mail,
} from "lucide-react";
import { TenantMember, RoleModel } from "@/types/auth";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { UserDialog } from "./UserDialog";
import { useVerifyPermissions } from "@/components/rbac";
import { TENANT_PERMISSIONS } from "@/constants/permissions";

interface UsersTabProps {
	tenantId: string;
}

export function UsersTab({ tenantId }: UsersTabProps) {
	const { can } = useVerifyPermissions({
		scope: "tenant",
		tenantId,
	});
	const canEdit = can(TENANT_PERMISSIONS.USER_EDIT);
	const canDelete = can(TENANT_PERMISSIONS.USER_ALL);

	const [members, setMembers] = useState<TenantMember[]>([]);
	const [roles, setRoles] = useState<RoleModel[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingMember, setEditingMember] = useState<TenantMember | undefined>(
		undefined
	);
	const [isSaving, setIsSaving] = useState(false);
	const [memberToDelete, setMemberToDelete] = useState<TenantMember | null>(
		null
	);

	const fetchMembers = useCallback(async () => {
		try {
			setIsLoading(true);
			const response = await apiService.fetchWithAuth<TenantMember[]>(
				"/tenant-members",
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
			setIsLoading(false);
		}
	}, [tenantId]);

	const fetchRoles = useCallback(async () => {
		try {
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
		}
	}, [tenantId]);

	useEffect(() => {
		fetchMembers();
		fetchRoles();
	}, [fetchMembers, fetchRoles]);

	const handleCreate = () => {
		setEditingMember(undefined);
		setIsDialogOpen(true);
	};

	const handleEdit = (member: TenantMember) => {
		setEditingMember(member);
		setIsDialogOpen(true);
	};

	const handleDeleteClick = (member: TenantMember) => {
		setMemberToDelete(member);
	};

	const handleSave = async (data: {
		userEmail?: string;
		tenantRoleId: string;
	}) => {
		try {
			setIsSaving(true);
			if (editingMember) {
				// Atualizar cargo do membro
				await apiService.fetchWithAuth(`/tenant-members/${editingMember.id}`, {
					method: "PUT",
					body: JSON.stringify({ tenantRoleId: data.tenantRoleId }),
					headers: {
						"x-tenant-id": tenantId,
					},
				});
				toast.success("Cargo do membro atualizado com sucesso.");
			} else {
				// Adicionar novo membro
				await apiService.fetchWithAuth("/tenant-members/assign", {
					method: "POST",
					body: JSON.stringify({
						userEmail: data.userEmail,
						tenantRoleId: data.tenantRoleId,
					}),
					headers: {
						"x-tenant-id": tenantId,
					},
				});
				toast.success("Membro adicionado com sucesso.");
			}
			setIsDialogOpen(false);
			fetchMembers();
		} catch (error: unknown) {
			console.error("Erro ao salvar membro:", error);
			const message =
				error instanceof Error
					? error.message
					: "Não foi possível salvar o membro.";
			toast.error(message);
		} finally {
			setIsSaving(false);
		}
	};

	const confirmDelete = async () => {
		if (!memberToDelete) return;

		try {
			await apiService.fetchWithAuth(`/tenant-members/${memberToDelete.id}`, {
				method: "DELETE",
				headers: {
					"x-tenant-id": tenantId,
				},
			});
			toast.success("Membro removido com sucesso.");
			fetchMembers();
		} catch (error) {
			console.error("Erro ao remover membro:", error);
			toast.error("Não foi possível remover o membro.");
		} finally {
			setMemberToDelete(null);
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
					<h3 className="text-lg font-medium">Usuários</h3>
					<p className="text-sm text-muted-foreground">
						Gerencie os membros e seus cargos na instituição.
					</p>
				</div>
				{canEdit && (
					<Button onClick={handleCreate} className="gap-2">
						<Plus className="w-4 h-4" />
						Adicionar Membro
					</Button>
				)}
			</div>

			<div className="border rounded-md">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Usuário</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Cargo</TableHead>
							<TableHead className="w-20"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{members.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={4}
									className="text-center py-8 text-muted-foreground"
								>
									Nenhum membro encontrado.
								</TableCell>
							</TableRow>
						) : (
							members.map((member) => (
								<TableRow
									key={member.id}
									className="hover:bg-primary/10 transition-colors cursor-pointer"
								>
									<TableCell className="font-semibold text-white">
										<div className="flex items-center gap-2">
											<UserCircle className="w-4 h-4 text-emerald-400" />
											{member.user.username}
										</div>
									</TableCell>
									<TableCell className="text-slate-300">
										<div className="flex items-center gap-2">
											<Mail className="w-4 h-4 text-slate-400" />
											{member.user.email}
										</div>
									</TableCell>
									<TableCell>
										<Badge
											variant="outline"
											className="text-xs border-emerald-500/50 text-emerald-300 bg-emerald-950/50"
										>
											{member.TenantRole?.name || "Sem cargo"}
										</Badge>
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
														onClick={() => handleEdit(member)}
														className="cursor-pointer"
													>
														<Pencil className="mr-2 h-4 w-4" />
														Alterar Cargo
													</DropdownMenuItem>
													{canDelete && (
														<DropdownMenuItem
															className="text-red-600 cursor-pointer"
															onClick={() => handleDeleteClick(member)}
														>
															<Trash2 className="mr-2 h-4 w-4" />
															Remover
														</DropdownMenuItem>
													)}
													<DropdownMenuSeparator />
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

			<UserDialog
				isOpen={isDialogOpen}
				onClose={() => setIsDialogOpen(false)}
				onSave={handleSave}
				member={editingMember}
				roles={roles}
				isLoading={isSaving}
			/>

			{/* Dialog de confirmação de exclusão */}
			<Dialog
				open={!!memberToDelete}
				onOpenChange={() => setMemberToDelete(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Remover Membro</DialogTitle>
						<DialogDescription>
							Tem certeza que deseja remover{" "}
							<strong>{memberToDelete?.user.username}</strong> da instituição?
							Esta ação não pode ser desfeita.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setMemberToDelete(null)}>
							Cancelar
						</Button>
						<Button variant="destructive" onClick={confirmDelete}>
							Remover
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

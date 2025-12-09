"use client";

import { useParams } from "next/navigation";
import { VerifyPermissions } from "@/components/rbac";
import { SCENARIO_PERMISSIONS } from "@/constants/permissions";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Users,
	Plus,
	Search,
	UserPlus,
	MoreVertical,
	Pencil,
	Trash2,
	Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useMemo } from "react";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScenarioUserDialog } from "./ScenarioUserDialog";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

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
		name: string;
	};
}

export default function ScenarioUsersPage() {
	const params = useParams();
	const { user } = useAuth();
	const scenarioId = params.scenarioId as string;

	const [users, setUsers] = useState<ScenarioUser[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingUser, setEditingUser] = useState<ScenarioUser | null>(null);
	const [userToDelete, setUserToDelete] = useState<ScenarioUser | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const tenantId = useMemo(() => {
		if (!user?.userTenants) return "";
		for (const ut of user.userTenants) {
			const us = ut.UserScenarios?.find(
				(scenario) => scenario.Scenario?.id === scenarioId
			);
			if (us) return ut.tenantId;
		}
		return "";
	}, [user, scenarioId]);

	const fetchUsers = async () => {
		try {
			setIsLoading(true);
			const response = await apiService.fetchWithAuth<ScenarioUser[]>(
				`/scenario-members/${scenarioId}`,
				{
					headers: {
						"x-tenant-id": tenantId,
						"x-scenario-id": scenarioId,
					},
				}
			);
			if (response.data) {
				setUsers(response.data);
			}
		} catch (error) {
			// console.error("Erro ao buscar usuários:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Não foi possível carregar os usuários."
			);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (scenarioId) {
			fetchUsers();
		}
	}, [scenarioId]);

	const filteredUsers = users.filter(
		(u) =>
			u.UserTenant.user.username
				.toLowerCase()
				.includes(searchQuery.toLowerCase()) ||
			u.UserTenant.user.email.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const handleAddUser = () => {
		setEditingUser(null);
		setIsDialogOpen(true);
	};

	const handleEditUser = (user: ScenarioUser) => {
		setEditingUser(user);
		setIsDialogOpen(true);
	};

	const handleDeleteUser = async () => {
		if (!userToDelete) return;

		try {
			setIsDeleting(true);
			await apiService.fetchWithAuth(
				`/scenario-members/${userToDelete.id}?scenarioId=${scenarioId}`,
				{
					method: "DELETE",
					headers: {
						"x-tenant-id": tenantId,
						"x-scenario-id": scenarioId,
					},
				}
			);
			toast.success("Usuário removido com sucesso.");
			fetchUsers();
			setUserToDelete(null);
		} catch (error) {
			console.error("Erro ao remover usuário:", error);
			toast.error("Não foi possível remover o usuário.");
		} finally {
			setIsDeleting(false);
		}
	};

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.substring(0, 2);
	};

	return (
		<VerifyPermissions
			scope="scenario"
			tenantId={tenantId}
			scenarioId={scenarioId}
			permissions={SCENARIO_PERMISSIONS.USER_VIEW}
			fallback={
				<div className="flex items-center justify-center h-64">
					<div className="text-center">
						<Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
						<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
							Acesso Negado
						</h3>
						<p className="text-gray-500 dark:text-gray-400 mt-1">
							Você não tem permissão para gerenciar usuários do cenário.
						</p>
					</div>
				</div>
			}
		>
			<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
							<Users className="w-6 h-6 text-indigo-600" />
							Usuários do Cenário
						</h2>
						<p className="text-gray-600 dark:text-gray-400 mt-1">
							Gerencie os usuários que têm acesso a este cenário
						</p>
					</div>
					<VerifyPermissions
						scope="scenario"
						tenantId={tenantId}
						scenarioId={scenarioId}
						permissions={SCENARIO_PERMISSIONS.USER_EDIT}
					>
						<Button onClick={handleAddUser} className="gap-2">
							<UserPlus className="w-4 h-4" />
							Adicionar Usuário
						</Button>
					</VerifyPermissions>
				</div>

				{/* Search */}
				<div className="flex gap-4">
					<div className="relative flex-1 max-w-md">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<Input
							placeholder="Buscar usuários..."
							className="pl-10"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</div>

				{/* Content */}
				<Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
					<CardContent className="p-0">
						{isLoading ? (
							<div className="flex items-center justify-center py-12">
								<Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
							</div>
						) : filteredUsers.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12">
								<Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
								<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
									Nenhum usuário encontrado
								</h3>
								<p className="text-gray-500 dark:text-gray-400 mt-1 text-center max-w-md">
									{searchQuery
										? "Tente buscar com outros termos."
										: "Adicione usuários da instituição para colaborar neste cenário."}
								</p>
								{!searchQuery && (
									<VerifyPermissions
										scope="scenario"
										tenantId={tenantId}
										scenarioId={scenarioId}
										permissions={SCENARIO_PERMISSIONS.USER_EDIT}
									>
										<Button onClick={handleAddUser} className="mt-4 gap-2">
											<UserPlus className="w-4 h-4" />
											Adicionar Primeiro Usuário
										</Button>
									</VerifyPermissions>
								)}
							</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Usuário</TableHead>
										<TableHead>Cargo</TableHead>
										<TableHead className="w-[100px]"></TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredUsers.map((scenarioUser) => (
										<TableRow key={scenarioUser.id}>
											<TableCell>
												<div className="flex items-center gap-3">
													<Avatar>
														<AvatarImage
															src={`https://avatar.vercel.sh/${scenarioUser.UserTenant.user.username}`}
														/>
														<AvatarFallback>
															{getInitials(
																scenarioUser.UserTenant.user.username
															)}
														</AvatarFallback>
													</Avatar>
													<div>
														<div className="font-medium text-gray-900 dark:text-gray-100">
															{scenarioUser.UserTenant.user.username}
														</div>
														<div className="text-sm text-gray-500 dark:text-gray-400">
															{scenarioUser.UserTenant.user.email}
														</div>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<Badge variant="outline" className="bg-indigo-50/50">
													{scenarioUser.ScenarioRole?.name || "Sem Cargo"}
												</Badge>
											</TableCell>
											<TableCell>
												<VerifyPermissions
													scope="scenario"
													tenantId={tenantId}
													scenarioId={scenarioId}
													permissions={SCENARIO_PERMISSIONS.USER_EDIT}
												>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8"
															>
																<MoreVertical className="w-4 h-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem
																onClick={() => handleEditUser(scenarioUser)}
															>
																<Pencil className="w-4 h-4 mr-2" />
																Editar
															</DropdownMenuItem>
															<VerifyPermissions
																scope="scenario"
																tenantId={tenantId}
																scenarioId={scenarioId}
																permissions={SCENARIO_PERMISSIONS.USER_ALL}
															>
																<DropdownMenuItem
																	className="text-red-600 focus:text-red-600"
																	onClick={() => setUserToDelete(scenarioUser)}
																>
																	<Trash2 className="w-4 h-4 mr-2" />
																	Remover
																</DropdownMenuItem>
															</VerifyPermissions>
														</DropdownMenuContent>
													</DropdownMenu>
												</VerifyPermissions>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			</div>

			<ScenarioUserDialog
				open={isDialogOpen}
				onOpenChange={setIsDialogOpen}
				scenarioId={scenarioId}
				tenantId={tenantId}
				editingUser={editingUser}
				onSaved={() => {
					setIsDialogOpen(false);
					fetchUsers();
				}}
			/>

			<Dialog
				open={!!userToDelete}
				onOpenChange={(open: boolean) => !open && setUserToDelete(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Remover usuário do cenário?</DialogTitle>
						<DialogDescription>
							Tem certeza que deseja remover o usuário{" "}
							<span className="font-medium text-gray-900 dark:text-gray-100">
								{userToDelete?.UserTenant.user.username}
							</span>{" "}
							deste cenário? Esta ação não pode ser desfeita.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setUserToDelete(null)}
							disabled={isDeleting}
						>
							Cancelar
						</Button>
						<Button
							variant="destructive"
							onClick={(e: React.MouseEvent) => {
								e.preventDefault();
								handleDeleteUser();
							}}
							disabled={isDeleting}
							className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
						>
							{isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
							Remover
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</VerifyPermissions>
	);
}

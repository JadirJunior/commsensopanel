"use client";

import { useParams } from "next/navigation";
import { VerifyPermissions } from "@/components/rbac";
import { SCENARIO_PERMISSIONS } from "@/constants/permissions";
import { useAuth } from "@/contexts/AuthContext";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Cpu,
	Plus,
	Search,
	MoreHorizontal,
	Power,
	PowerOff,
	Wifi,
	MapPin,
	Hash,
	Eye,
	Pencil,
	Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DeviceScenario, DeviceState } from "@/types/device";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { DeviceScenarioDialog } from "@/components/dashboard/devices/DeviceScenarioDialog";
import { DeviceDetailsDialog } from "@/components/dashboard/devices/DeviceDetailsDialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export default function DevicesPage() {
	const params = useParams();
	const { user } = useAuth();
	const scenarioId = params.scenarioId as string;
	const [devices, setDevices] = useState<DeviceScenario[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [dialogOpen, setDialogOpen] = useState(false);

	// Estados para detalhes/edição do dispositivo
	const [selectedDevice, setSelectedDevice] = useState<DeviceScenario | null>(
		null,
	);
	const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
	const [detailsDialogMode, setDetailsDialogMode] = useState<"view" | "edit">(
		"view",
	);

	// Estado para confirmação de exclusão
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [deviceToDelete, setDeviceToDelete] = useState<DeviceScenario | null>(
		null,
	);
	const [isDeleting, setIsDeleting] = useState(false);

	// Encontra o tenantId do cenário
	const tenantId = useMemo(() => {
		if (!user?.userTenants) return "";
		for (const ut of user.userTenants) {
			const us = ut.UserScenarios?.find(
				(scenario) => scenario.Scenario?.id === scenarioId,
			);
			if (us) return ut.tenantId;
		}
		return "";
	}, [user, scenarioId]);

	const fetchDevices = useCallback(async () => {
		try {
			setIsLoading(true);
			const response = await apiService.fetchWithAuth<DeviceScenario[]>(
				"/device-scenario",
				{
					headers: {
						"x-tenant-id": tenantId,
						"x-scenario-id": scenarioId,
					},
				},
			);
			if (response.data) {
				setDevices(response.data);
			}
		} catch (error) {
			toast.error(` ${error}`);
		} finally {
			setIsLoading(false);
		}
	}, [tenantId, scenarioId]);

	useEffect(() => {
		if (tenantId) {
			fetchDevices();
		}
	}, [tenantId, fetchDevices]);

	const handleViewDetails = (device: DeviceScenario) => {
		setSelectedDevice(device);
		setDetailsDialogMode("view");
		setDetailsDialogOpen(true);
	};

	const handleEditLocation = (device: DeviceScenario) => {
		setSelectedDevice(device);
		setDetailsDialogMode("edit");
		setDetailsDialogOpen(true);
	};

	const handleDeleteClick = (device: DeviceScenario) => {
		setDeviceToDelete(device);
		setDeleteConfirmOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!deviceToDelete) return;

		try {
			setIsDeleting(true);
			await apiService.fetchWithAuth(`/device-scenario/${deviceToDelete.id}`, {
				method: "DELETE",
				headers: {
					"x-tenant-id": tenantId,
					"x-scenario-id": scenarioId,
				},
			});
			toast.success("Dispositivo removido com sucesso.");
			fetchDevices();
		} catch (error: any) {
			console.error("Erro ao remover dispositivo:", error);
			toast.error(error.message || "Não foi possível remover o dispositivo.");
		} finally {
			setIsDeleting(false);
			setDeleteConfirmOpen(false);
			setDeviceToDelete(null);
		}
	};

	const filteredDevices = useMemo(() => {
		if (!searchTerm) return devices;
		const term = searchTerm.toLowerCase();
		const roleLabels = {
			gateway: "gateway",
			node: "nó node",
			self: "independente próprio self",
		};
		return devices.filter(
			(device) =>
				device.name?.toLowerCase().includes(term) ||
				device.macAddress.toLowerCase().includes(term) ||
				device.mqttClientId.toLowerCase().includes(term) ||
				device.Device?.name.toLowerCase().includes(term) ||
				device.Spot?.name.toLowerCase().includes(term) ||
				roleLabels[device.role].includes(term),
		);
	}, [devices, searchTerm]);

	const getStatusBadge = (status: DeviceScenario["status"]) => {
		const statusConfig = {
			provisioned: {
				label: "Provisionado",
				className:
					"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
			},
			active: {
				label: "Ativo",
				className:
					"bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
			},
			blocked: {
				label: "Bloqueado",
				className:
					"bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
			},
		};
		const config = statusConfig[status];
		return <Badge className={config.className}>{config.label}</Badge>;
	};

	const getDeviceStateBadge = (status: DeviceState["status"]) => {
		const stateConfig = {
			ONLINE: {
				label: "Online",
				icon: Power,
				className:
					"bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
			},
			OFFLINE: {
				label: "Offline",
				icon: PowerOff,
				className:
					"bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
			},
			MEASURING: {
				label: "Medindo",
				icon: Cpu,
				className:
					"bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
			},
			ERROR: {
				label: "Erro",
				icon: PowerOff,
				className:
					"bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
			},
			MAINTENANCE: {
				label: "Manutenção",
				icon: Cpu,
				className:
					"bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
			},
		};
		const config = stateConfig[status];
		const Icon = config.icon;
		return (
			<Badge className={config.className}>
				<Icon className="w-3 h-3 mr-1" />
				{config.label}
			</Badge>
		);
	};

	return (
		<VerifyPermissions
			scope="scenario"
			tenantId={tenantId}
			scenarioId={scenarioId}
			permissions={SCENARIO_PERMISSIONS.DEVICE_VIEW}
			fallback={
				<div className="flex items-center justify-center h-64">
					<div className="text-center">
						<Cpu className="w-12 h-12 text-gray-400 mx-auto mb-4" />
						<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
							Acesso Negado
						</h3>
						<p className="text-gray-500 dark:text-gray-400 mt-1">
							Você não tem permissão para visualizar dispositivos.
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
							<Cpu className="w-6 h-6 text-blue-600" />
							Dispositivos
						</h2>
						<p className="text-gray-600 dark:text-gray-400 mt-1">
							Gerencie os dispositivos IoT deste cenário
						</p>
					</div>
					<VerifyPermissions
						scope="scenario"
						tenantId={tenantId}
						scenarioId={scenarioId}
						permissions={SCENARIO_PERMISSIONS.DEVICE_EDIT}
					>
						<Button className="gap-2" onClick={() => setDialogOpen(true)}>
							<Plus className="w-4 h-4" />
							Novo Dispositivo
						</Button>
					</VerifyPermissions>
				</div>

				{/* Content */}
				{isLoading ? (
					<Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
						<CardContent className="flex items-center justify-center py-12">
							<div className="text-center">
								<Cpu className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4 animate-pulse mx-auto" />
								<p className="text-gray-500 dark:text-gray-400">
									Carregando dispositivos...
								</p>
							</div>
						</CardContent>
					</Card>
				) : filteredDevices.length === 0 ? (
					<Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 border-dashed">
						<CardContent className="flex flex-col items-center justify-center py-12">
							<Cpu className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
							<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
								{searchTerm
									? "Nenhum dispositivo encontrado"
									: "Nenhum dispositivo cadastrado"}
							</h3>
							<p className="text-gray-500 dark:text-gray-400 mt-1 text-center max-w-md">
								{searchTerm
									? "Tente ajustar os filtros de busca."
									: "Adicione dispositivos IoT para começar a monitorar seus dados de sustentabilidade."}
							</p>
							{!searchTerm && (
								<VerifyPermissions
									scope="scenario"
									tenantId={tenantId}
									scenarioId={scenarioId}
									permissions={SCENARIO_PERMISSIONS.DEVICE_EDIT}
								>
									<Button
										className="mt-4 gap-2"
										onClick={() => setDialogOpen(true)}
									>
										<Plus className="w-4 h-4" />
										Adicionar Dispositivo
									</Button>
								</VerifyPermissions>
							)}
						</CardContent>
					</Card>
				) : (
					<Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
						<CardHeader>
							<CardTitle>Dispositivos Cadastrados</CardTitle>
							<CardDescription>
								{filteredDevices.length} dispositivo(s) encontrado(s)
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Nome</TableHead>
										<TableHead>Modelo</TableHead>
										<TableHead>Tipo</TableHead>
										<TableHead>Local</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Estado IoT</TableHead>
										<TableHead>Claim Code</TableHead>
										<TableHead className="w-[50px]"></TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredDevices.map((device) => (
										<TableRow key={device.id}>
											<TableCell className="font-medium">
												{device.name || (
													<span className="text-gray-400 italic">-</span>
												)}
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Cpu className="w-4 h-4 text-blue-600" />
													{device.Device?.name || "N/A"}
												</div>
											</TableCell>
											<TableCell>
												{device.role === "gateway" && (
													<Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
														Gateway
													</Badge>
												)}
												{device.role === "node" && (
													<Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
														Nó
													</Badge>
												)}
												{device.role === "self" && (
													<Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
														Independente
													</Badge>
												)}
											</TableCell>
											<TableCell>
												{device.Spot ? (
													<div className="flex items-center gap-2">
														<MapPin className="w-3 h-3 text-emerald-600" />
														{device.Spot.name}
													</div>
												) : (
													<span className="text-gray-400">-</span>
												)}
											</TableCell>
											<TableCell>{getStatusBadge(device.status)}</TableCell>
											<TableCell>
												{device.deviceStates?.[0] ? (
													getDeviceStateBadge(device.deviceStates[0].status)
												) : (
													<span className="text-xs text-gray-400">-</span>
												)}
											</TableCell>
											<TableCell>
												<code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
													{device.claimCode}
												</code>
											</TableCell>
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="icon">
															<MoreHorizontal className="w-4 h-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem
															onClick={() => handleViewDetails(device)}
														>
															<Eye className="w-4 h-4 mr-2" />
															Ver Detalhes
														</DropdownMenuItem>
														<VerifyPermissions
															scope="scenario"
															tenantId={tenantId}
															scenarioId={scenarioId}
															permissions={SCENARIO_PERMISSIONS.DEVICE_EDIT}
														>
															<DropdownMenuItem
																onClick={() => handleEditLocation(device)}
															>
																<Pencil className="w-4 h-4 mr-2" />
																Editar
															</DropdownMenuItem>
														</VerifyPermissions>
														<VerifyPermissions
															scope="scenario"
															tenantId={tenantId}
															scenarioId={scenarioId}
															permissions={SCENARIO_PERMISSIONS.DEVICE_ALL}
														>
															<DropdownMenuSeparator />
															<DropdownMenuItem
																onClick={() => handleDeleteClick(device)}
																className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
															>
																<Trash2 className="w-4 h-4 mr-2" />
																Remover
															</DropdownMenuItem>
														</VerifyPermissions>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				)}

				<DeviceScenarioDialog
					open={dialogOpen}
					onOpenChange={setDialogOpen}
					tenantId={tenantId}
					scenarioId={scenarioId}
					onSaved={fetchDevices}
				/>

				<DeviceDetailsDialog
					open={detailsDialogOpen}
					onOpenChange={setDetailsDialogOpen}
					device={selectedDevice}
					deviceState={selectedDevice?.deviceStates?.[0]}
					tenantId={tenantId}
					scenarioId={scenarioId}
					onSaved={fetchDevices}
					mode={detailsDialogMode}
				/>

				<ConfirmationDialog
					open={deleteConfirmOpen}
					onOpenChange={setDeleteConfirmOpen}
					onConfirm={handleDeleteConfirm}
					title="Remover Dispositivo"
					description={`Tem certeza que deseja remover o dispositivo "${deviceToDelete?.Device?.name || deviceToDelete?.macAddress}"? Esta ação não pode ser desfeita.`}
					confirmText={isDeleting ? "Removendo..." : "Remover"}
					cancelText="Cancelar"
					variant="destructive"
				/>
			</div>
		</VerifyPermissions>
	);
}

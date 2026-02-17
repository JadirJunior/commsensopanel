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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Loader2,
	Cpu,
	Hash,
	Wifi,
	MapPin,
	Calendar,
	Key,
	Shield,
	Building2,
	Tag,
	Network,
	Power,
	PowerOff,
	Activity,
	Clock,
	Database,
} from "lucide-react";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { DeviceScenario, DeviceState } from "@/types/device";
import { Spot } from "@/types/spot";
import {
	canChangeRole,
	getRoleLabel,
	getRoleDescription,
	type DeviceRole,
} from "@/lib/deviceValidation";

interface DeviceDetailsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	device: DeviceScenario | null;
	deviceState?: DeviceState;
	tenantId: string;
	scenarioId: string;
	onSaved: () => void;
	mode: "view" | "edit";
}

export function DeviceDetailsDialog({
	open,
	onOpenChange,
	device,
	deviceState,
	tenantId,
	scenarioId,
	onSaved,
	mode,
}: DeviceDetailsDialogProps) {
	const [isSaving, setIsSaving] = useState(false);
	const [spots, setSpots] = useState<Spot[]>([]);
	const [gateways, setGateways] = useState<
		Array<{ id: string; name: string; macAddress: string }>
	>([]);
	const [isLoadingSpots, setIsLoadingSpots] = useState(false);
	const [selectedSpotId, setSelectedSpotId] = useState<string>("");
	const [deviceName, setDeviceName] = useState<string>("");
	const [deviceRole, setDeviceRole] = useState<DeviceRole>("self");
	const [nodeId, setNodeId] = useState<string>("");
	const [deviceParentId, setDeviceParentId] = useState<string>("");

	const fetchSpots = useCallback(async () => {
		try {
			setIsLoadingSpots(true);
			const response = await apiService.fetchWithAuth<Spot[]>(
				`/spot?scenarioId=${scenarioId}`,
				{
					headers: {
						"x-tenant-id": tenantId,
						"x-scenario-id": scenarioId,
					},
				},
			);
			if (response.data) {
				setSpots(response.data);
			}
		} catch (error) {
			console.error("Erro ao buscar spots:", error);
			toast.error("Não foi possível carregar os locais.");
		} finally {
			setIsLoadingSpots(false);
		}
	}, [tenantId, scenarioId]);

	const fetchGateways = useCallback(async () => {
		try {
			const response = await apiService.fetchWithAuth<any[]>(
				"/device-scenario",
				{
					headers: {
						"x-tenant-id": tenantId,
						"x-scenario-id": scenarioId,
					},
				},
			);
			if (response.data) {
				const gatewayDevices = response.data
					.filter(
						(d) =>
							d.role === "gateway" &&
							d.status === "active" &&
							d.id !== device?.id,
					)
					.map((d) => ({
						id: d.id,
						name: d.name || d.Device?.name || "Gateway sem nome",
						macAddress: d.macAddress,
					}));
				setGateways(gatewayDevices);
			}
		} catch (error) {
			console.error("Erro ao buscar gateways:", error);
			toast.error("Não foi possível carregar os gateways disponíveis.");
		}
	}, [tenantId, scenarioId, device?.id]);

	useEffect(() => {
		if (open && mode === "edit") {
			fetchSpots();
			fetchGateways();
		}
		if (open && device) {
			setSelectedSpotId(device.spotId || "__none__");
			setDeviceName(device.name || "");
			setDeviceRole(device.role || "self");
			setNodeId(device.nodeId || "");
			setDeviceParentId(device.deviceParentId || "");
		}
	}, [open, mode, device, fetchSpots, fetchGateways]);

	const handleSave = async () => {
		if (!device) return;

		// Validate role change
		const roleValidation = canChangeRole(
			device.role,
			deviceRole,
			device.Device || null,
		);
		if (!roleValidation.valid) {
			toast.error(roleValidation.reason || "Função inválida");
			return;
		}

		// Validate node requirements
		if (deviceRole === "node") {
			if (!nodeId) {
				toast.error(
					"O identificador do nó é obrigatório para dispositivos do tipo Nó.",
				);
				return;
			}
			if (!deviceParentId) {
				toast.error("Selecione um gateway pai para o dispositivo do tipo Nó.");
				return;
			}
		}

		try {
			setIsSaving(true);
			const spotIdToSave =
				selectedSpotId === "__none__" ? null : selectedSpotId;
			await apiService.fetchWithAuth(`/device-scenario/${device.id}`, {
				method: "PATCH",
				body: JSON.stringify({
					name: deviceName || null,
					spotId: spotIdToSave,
					role: deviceRole,
					nodeId: deviceRole === "node" ? nodeId || null : null,
					deviceParentId: deviceRole === "node" ? deviceParentId || null : null,
				}),
				headers: {
					"x-tenant-id": tenantId,
					"x-scenario-id": scenarioId,
				},
			});
			toast.success("Dispositivo atualizado com sucesso.");
			onSaved();
			onOpenChange(false);
		} catch (error: any) {
			console.error("Erro ao atualizar dispositivo:", error);
			toast.error(error.message || "Não foi possível atualizar o dispositivo.");
		} finally {
			setIsSaving(false);
		}
	};

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

	const getRoleBadge = (role: DeviceRole) => {
		const roleConfig = {
			gateway: {
				label: "Gateway",
				className:
					"bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
			},
			node: {
				label: "Nó",
				className:
					"bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
			},
			self: {
				label: "Independente",
				className:
					"bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
			},
		};
		const config = roleConfig[role];
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
				icon: Activity,
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
				icon: Activity,
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

	const formatDate = (dateString: string | null) => {
		if (!dateString) return "-";
		return new Date(dateString).toLocaleString("pt-BR", {
			dateStyle: "short",
			timeStyle: "short",
		});
	};

	if (!device) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[550px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
				<DialogHeader>
					<DialogTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
						<Cpu className="w-5 h-5 text-blue-600" />
						{mode === "view" ? "Detalhes do Dispositivo" : "Editar Dispositivo"}
					</DialogTitle>
					<DialogDescription className="text-gray-600 dark:text-gray-400">
						{mode === "view"
							? "Visualize as informações do dispositivo"
							: "Altere o nome e local vinculado ao dispositivo"}
					</DialogDescription>
				</DialogHeader>

				<ScrollArea className="max-h-[60vh]">
					<div className="space-y-4 py-4 px-1">
						{mode === "view" ? (
							<>
								{/* Nome e Modelo */}
								<div className="space-y-3">
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-1">
											<h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
												<Cpu className="w-4 h-4 text-blue-600" />
												Nome
											</h4>
											<div className="pl-6 text-sm text-gray-600 dark:text-gray-400">
												{device.name || (
													<span className="text-gray-400 italic">
														Não definido
													</span>
												)}
											</div>
										</div>
										<div className="space-y-1">
											<h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
												<Building2 className="w-4 h-4 text-gray-500" />
												Modelo
											</h4>
											<div className="pl-6 text-sm text-gray-600 dark:text-gray-400">
												{device.Device?.name || "N/A"}
											</div>
										</div>
									</div>
								</div>

								<Separator className="bg-gray-200 dark:bg-gray-800" />

								{/* Função do Dispositivo */}
								<div className="space-y-3">
									<h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
										<Network className="w-4 h-4 text-purple-600" />
										Função
									</h4>
									<div className="pl-6 space-y-2">
										<div>{getRoleBadge(device.role)}</div>
										<p className="text-xs text-gray-500 dark:text-gray-400">
											{getRoleDescription(device.role)}
										</p>
									</div>
								</div>

								<Separator className="bg-gray-200 dark:bg-gray-800" />

								{/* Identificadores */}
								<div className="space-y-3">
									<h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
										Identificadores
									</h4>
									<div className="grid grid-cols-2 gap-4 pl-2">
										<div className="space-y-1">
											<Label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
												<Hash className="w-3 h-3" />
												MAC Address
											</Label>
											<div className="font-mono text-sm text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
												{device.macAddress}
											</div>
										</div>
										<div className="space-y-1">
											<Label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
												<Wifi className="w-3 h-3" />
												MQTT Client ID
											</Label>
											<div className="font-mono text-sm text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
												{device.mqttClientId}
											</div>
										</div>
										{device.role === "node" && (
											<>
												<div className="space-y-1">
													<Label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
														<Hash className="w-3 h-3" />
														Node ID
													</Label>
													<div className="font-mono text-sm text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
														{device.nodeId || (
															<span className="text-gray-400 italic">
																Não definido
															</span>
														)}
													</div>
												</div>
												<div className="space-y-1">
													<Label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
														<Network className="w-3 h-3" />
														Dispositivo Pai
													</Label>
													<div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
														{device.DeviceParent?.name || (
															<span className="text-gray-400 italic">
																Não definido
															</span>
														)}
													</div>
												</div>
											</>
										)}
									</div>
								</div>

								<Separator className="bg-gray-200 dark:bg-gray-800" />

								{/* Status e Claim Code */}
								<div className="space-y-3">
									<h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
										Status & Segurança
									</h4>
									<div className="grid grid-cols-2 gap-4 pl-2">
										<div className="space-y-1">
											<Label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
												<Shield className="w-3 h-3" />
												Status
											</Label>
											<div>{getStatusBadge(device.status)}</div>
										</div>
										<div className="space-y-1">
											<Label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
												<Key className="w-3 h-3" />
												Claim Code
											</Label>
											<code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded block">
												{device.claimCode}
											</code>
										</div>
									</div>
								</div>

								<Separator className="bg-gray-200 dark:bg-gray-800" />

								{/* Localização */}
								<div className="space-y-3">
									<h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
										<MapPin className="w-4 h-4 text-emerald-600" />
										Localização
									</h4>
									<div className="pl-6 text-sm text-gray-600 dark:text-gray-400">
										{device.Spot?.name || (
											<span className="text-gray-400 italic">
												Não vinculado
											</span>
										)}
									</div>
								</div>

								<Separator className="bg-gray-200 dark:bg-gray-800" />

								{/* Estado do Dispositivo */}
								<div className="space-y-3">
									<h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
										<Activity className="w-4 h-4 text-blue-600" />
										Estado do Dispositivo
									</h4>
									{deviceState ? (
										<div className="pl-6 space-y-3">
											<div className="flex items-center justify-between">
												<div className="space-y-1">
													<Label className="text-xs text-gray-500 dark:text-gray-400">
														Status Atual
													</Label>
													<div>{getDeviceStateBadge(deviceState.status)}</div>
												</div>
												<div className="space-y-1">
													<Label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
														<Clock className="w-3 h-3" />
														Última Atualização
													</Label>
													<div className="text-xs text-gray-600 dark:text-gray-400">
														{new Date(deviceState.dtState).toLocaleString(
															"pt-BR",
															{
																dateStyle: "short",
																timeStyle: "medium",
															},
														)}
													</div>
												</div>
											</div>

											{/* Metadados */}
											{deviceState.metadata &&
												Object.keys(deviceState.metadata).length > 0 && (
													<div className="space-y-2">
														<Label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
															<Database className="w-3 h-3" />
															Metadados
														</Label>
														<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
															{Object.entries(deviceState.metadata).map(
																([key, value]) => (
																	<div
																		key={key}
																		className="flex items-start justify-between text-xs"
																	>
																		<span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
																			{key.replace(/_/g, " ")}:
																		</span>
																		<span className="text-gray-600 dark:text-gray-400 font-mono ml-2">
																			{typeof value === "object"
																				? JSON.stringify(value)
																				: String(value)}
																		</span>
																	</div>
																),
															)}
														</div>
													</div>
												)}
										</div>
									) : (
										<div className="pl-6 text-sm text-gray-400 italic">
											Nenhum estado registrado ainda
										</div>
									)}
								</div>

								<Separator className="bg-gray-200 dark:bg-gray-800" />

								{/* Datas */}
								<div className="space-y-3">
									<h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
										Histórico
									</h4>
									<div className="grid grid-cols-2 gap-4 pl-2">
										<div className="space-y-1">
											<Label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
												<Calendar className="w-3 h-3" />
												Ativado em
											</Label>
											<div className="text-sm text-gray-900 dark:text-gray-100">
												{formatDate(device.activatedAt)}
											</div>
										</div>
										<div className="space-y-1">
											<Label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
												<Calendar className="w-3 h-3" />
												Bloqueado em
											</Label>
											<div className="text-sm text-gray-900 dark:text-gray-100">
												{formatDate(device.blockedAt)}
											</div>
										</div>
									</div>
								</div>
							</>
						) : (
							<>
								{/* Modo de Edição */}
								<div className="space-y-3">
									<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
										<Cpu className="w-4 h-4 text-blue-600" />
										<span className="font-medium">{device.Device?.name}</span>
										<span className="text-gray-400">|</span>
										<code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
											{device.macAddress}
										</code>
									</div>
								</div>

								<Separator className="bg-gray-200 dark:bg-gray-800" />

								{/* Nome do Dispositivo */}
								<div className="space-y-2">
									<Label
										htmlFor="deviceName"
										className="text-gray-900 dark:text-gray-100 flex items-center gap-2"
									>
										<Tag className="w-4 h-4 text-blue-600" />
										Nome do Dispositivo
									</Label>
									<Input
										id="deviceName"
										placeholder="Ex: Sensor da Sala 1, Medidor Norte..."
										value={deviceName}
										onChange={(e) => setDeviceName(e.target.value)}
										className="bg-white dark:bg-gray-800 text-gray-100 border-gray-300 dark:border-gray-700"
									/>
									<p className="text-xs text-gray-500 dark:text-gray-400">
										Um nome amigável para identificar o dispositivo
									</p>
								</div>

								{/* Função do Dispositivo */}
								<div className="space-y-2">
									<Label
										htmlFor="deviceRole"
										className="text-gray-900 dark:text-gray-100 flex items-center gap-2"
									>
										<Network className="w-4 h-4 text-purple-600" />
										Função do Dispositivo
									</Label>
									<Select
										value={deviceRole}
										onValueChange={(value: DeviceRole) => setDeviceRole(value)}
									>
										<SelectTrigger
											id="deviceRole"
											className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem
												value="gateway"
												disabled={
													device.role !== "gateway" &&
													!device.Device?.canActAsGateway
												}
											>
												{getRoleLabel("gateway")}
												{device.role !== "gateway" &&
													!device.Device?.canActAsGateway && (
														<span className="ml-2 text-xs text-gray-500">
															(não disponível)
														</span>
													)}
											</SelectItem>
											<SelectItem
												value="node"
												disabled={device.role === "gateway"}
											>
												{getRoleLabel("node")}
												{device.role === "gateway" && (
													<span className="ml-2 text-xs text-gray-500">
														(bloqueado)
													</span>
												)}
											</SelectItem>
											<SelectItem
												value="self"
												disabled={device.role === "gateway"}
											>
												{getRoleLabel("self")}
												{device.role === "gateway" && (
													<span className="ml-2 text-xs text-gray-500">
														(bloqueado)
													</span>
												)}
											</SelectItem>
										</SelectContent>
									</Select>
									<p className="text-xs text-gray-500 dark:text-gray-400">
										{getRoleDescription(deviceRole)}
									</p>
									{device.role === "gateway" && (
										<div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
											<p className="text-xs text-amber-700 dark:text-amber-300">
												<strong>Atenção:</strong> Dispositivos configurados como
												gateway não podem ter sua função alterada.
											</p>
										</div>
									)}
								</div>

								{/* Node ID e Gateway Pai (apenas para nós) */}
								{deviceRole === "node" && (
									<>
										<div className="space-y-2">
											<Label
												htmlFor="nodeId"
												className="text-gray-900 dark:text-gray-100 flex items-center gap-2"
											>
												<Hash className="w-4 h-4 text-blue-600" />
												Node ID <span className="text-red-500">*</span>
											</Label>
											<Input
												id="nodeId"
												placeholder="Ex: 01, 02, node-001..."
												value={nodeId}
												onChange={(e) => setNodeId(e.target.value)}
												className="bg-white dark:bg-gray-800 text-gray-100 border-gray-300 dark:border-gray-700"
											/>
											<p className="text-xs text-gray-500 dark:text-gray-400">
												Identificador único do nó na rede
											</p>
										</div>

										<div className="space-y-2">
											<Label
												htmlFor="deviceParent"
												className="text-gray-900 dark:text-gray-100 flex items-center gap-2"
											>
												<Network className="w-4 h-4 text-purple-600" />
												Gateway Pai <span className="text-red-500">*</span>
											</Label>
											<Select
												value={deviceParentId}
												onValueChange={setDeviceParentId}
											>
												<SelectTrigger
													id="deviceParent"
													className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
												>
													<SelectValue placeholder="Selecione o gateway" />
												</SelectTrigger>
												<SelectContent>
													{gateways.length === 0 ? (
														<div className="p-2 text-sm text-gray-500 dark:text-gray-400">
															Nenhum gateway ativo disponível
														</div>
													) : (
														gateways.map((gateway) => (
															<SelectItem key={gateway.id} value={gateway.id}>
																{gateway.name}
																<span className="ml-2 text-xs text-gray-500">
																	({gateway.macAddress})
																</span>
															</SelectItem>
														))
													)}
												</SelectContent>
											</Select>
											<p className="text-xs text-gray-500 dark:text-gray-400">
												O gateway que gerenciará este nó
											</p>
										</div>
									</>
								)}

								{/* Local */}
								<div className="space-y-2">
									<Label
										htmlFor="spot"
										className="text-gray-900 dark:text-gray-100 flex items-center gap-2"
									>
										<MapPin className="w-4 h-4 text-emerald-600" />
										Local
									</Label>
									{isLoadingSpots ? (
										<div className="flex justify-center py-4">
											<Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
										</div>
									) : (
										<Select
											value={selectedSpotId}
											onValueChange={setSelectedSpotId}
										>
											<SelectTrigger
												id="spot"
												className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
											>
												<SelectValue placeholder="Nenhum local selecionado" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="__none__">
													<span className="text-gray-400 italic">
														Nenhum local
													</span>
												</SelectItem>
												{spots.map((spot) => (
													<SelectItem key={spot.id} value={spot.id}>
														{spot.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
									<p className="text-xs text-gray-500 dark:text-gray-400">
										Vincule o dispositivo a um local do cenário para identificar
										sua posição.
									</p>
								</div>

								{selectedSpotId &&
									selectedSpotId !== "__none__" &&
									selectedSpotId !== device.spotId && (
										<div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
											<p className="text-sm text-blue-700 dark:text-blue-300">
												<strong>Alteração:</strong> O local será atualizado de{" "}
												<span className="font-medium">
													{device.Spot?.name || "Nenhum"}
												</span>{" "}
												para{" "}
												<span className="font-medium">
													{spots.find((s) => s.id === selectedSpotId)?.name}
												</span>
											</p>
										</div>
									)}

								{selectedSpotId === "__none__" && device.spotId && (
									<div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
										<p className="text-sm text-amber-700 dark:text-amber-300">
											<strong>Atenção:</strong> O dispositivo será desvinculado
											do local{" "}
											<span className="font-medium">{device.Spot?.name}</span>
										</p>
									</div>
								)}
							</>
						)}
					</div>
				</ScrollArea>

				<DialogFooter>
					{mode === "view" ? (
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							className="border-gray-300 dark:border-gray-700"
						>
							Fechar
						</Button>
					) : (
						<>
							<Button
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isSaving}
								className="border-gray-300 dark:border-gray-700"
							>
								Cancelar
							</Button>
							<Button
								onClick={handleSave}
								disabled={isSaving || isLoadingSpots}
								className="bg-emerald-600 hover:bg-emerald-700 text-white"
							>
								{isSaving ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Salvando...
									</>
								) : (
									"Salvar"
								)}
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

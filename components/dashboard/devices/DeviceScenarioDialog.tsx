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
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { DeviceBoilerplate } from "@/types/device";
import { Spot } from "@/types/spot";

interface DeviceScenarioDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	tenantId: string;
	scenarioId: string;
	onSaved: () => void;
}

export function DeviceScenarioDialog({
	open,
	onOpenChange,
	tenantId,
	scenarioId,
	onSaved,
}: DeviceScenarioDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [boilerplates, setBoilerplates] = useState<DeviceBoilerplate[]>([]);
	const [spots, setSpots] = useState<Spot[]>([]);
	const [gateways, setGateways] = useState<
		Array<{ id: string; name: string; macAddress: string }>
	>([]);
	const [selectedBoilerplate, setSelectedBoilerplate] =
		useState<DeviceBoilerplate | null>(null);
	const [formData, setFormData] = useState({
		boilerplateId: "",
		name: "",
		spotId: "",
		macAddress: "",
		role: "self" as "gateway" | "node" | "self",
		nodeId: "",
		deviceParentId: "",
	});

	const fetchBoilerplates = useCallback(async () => {
		try {
			setIsLoading(true);
			const response =
				await apiService.fetchWithAuth<DeviceBoilerplate[]>("/devices");
			if (response.data) {
				console.log("Modelos de dispositivos:", response.data);
				setBoilerplates(response.data);
			}
		} catch (error) {
			console.error("Erro ao buscar modelos de dispositivos:", error);
			toast.error("Não foi possível carregar os modelos de dispositivos.");
		} finally {
			setIsLoading(false);
		}
	}, []);

	const fetchSpots = useCallback(async () => {
		try {
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
						(device) => device.role === "gateway" && device.status === "active",
					)
					.map((device) => ({
						id: device.id,
						name: device.name || device.Device?.name || "Gateway sem nome",
						macAddress: device.macAddress,
					}));
				setGateways(gatewayDevices);
			}
		} catch (error) {
			console.error("Erro ao buscar gateways:", error);
			toast.error("Não foi possível carregar os gateways disponíveis.");
		}
	}, [tenantId, scenarioId]);

	useEffect(() => {
		if (open) {
			fetchBoilerplates();
			fetchSpots();
			fetchGateways();
			setFormData({
				boilerplateId: "",
				name: "",
				spotId: "",
				macAddress: "",
				role: "self",
				nodeId: "",
				deviceParentId: "",
			});
			setSelectedBoilerplate(null);
		}
	}, [open, fetchBoilerplates, fetchSpots, fetchGateways]);

	const handleBoilerplateChange = (boilerplateId: string) => {
		const boilerplate = boilerplates.find((bp) => bp.id === boilerplateId);
		setSelectedBoilerplate(boilerplate || null);

		// Reset role to 'self' if the selected device can't be a gateway
		const newRole =
			formData.role === "gateway" && !boilerplate?.canActAsGateway
				? "self"
				: formData.role;

		setFormData({ ...formData, boilerplateId, role: newRole });
	};

	const handleSave = async () => {
		if (!formData.boilerplateId || !formData.macAddress) {
			toast.error("Preencha todos os campos obrigatórios.");
			return;
		}

		// Validate role restrictions
		if (formData.role === "gateway" && !selectedBoilerplate?.canActAsGateway) {
			toast.error(
				"Este modelo de dispositivo não possui capacidade de atuar como gateway.",
			);
			return;
		}

		// Validate node requirements
		if (formData.role === "node") {
			if (!formData.nodeId) {
				toast.error(
					"O identificador do nó é obrigatório para dispositivos do tipo Nó.",
				);
				return;
			}
			if (!formData.deviceParentId) {
				toast.error("Selecione um gateway pai para o dispositivo do tipo Nó.");
				return;
			}
		}

		try {
			setIsSaving(true);
			await apiService.fetchWithAuth("/device-scenario", {
				method: "POST",
				body: JSON.stringify({
					boilerplateId: formData.boilerplateId,
					name: formData.name || undefined,
					spotId: formData.spotId || undefined,
					macAddress: formData.macAddress,
					role: formData.role,
					nodeId:
						formData.role === "node" && formData.nodeId
							? formData.nodeId
							: undefined,
					deviceParentId:
						formData.role === "node" && formData.deviceParentId
							? formData.deviceParentId
							: undefined,
					scenarioId,
				}),
				headers: {
					"x-tenant-id": tenantId,
					"x-scenario-id": scenarioId,
				},
			});
			toast.success("Dispositivo cadastrado com sucesso.");
			onSaved();
			onOpenChange(false);
		} catch (error: any) {
			console.error("Erro ao cadastrar dispositivo:", error);
			toast.error(error.message || "Não foi possível cadastrar o dispositivo.");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
				<DialogHeader>
					<DialogTitle className="text-gray-900 dark:text-gray-100">
						Novo Dispositivo
					</DialogTitle>
					<DialogDescription className="text-gray-600 dark:text-gray-400">
						Cadastre um novo dispositivo IoT neste cenário
					</DialogDescription>
				</DialogHeader>

				<ScrollArea className="max-h-[60vh]">
					<div className="space-y-4 py-4 px-1">
						{isLoading ? (
							<div className="flex justify-center py-8">
								<Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
							</div>
						) : (
							<>
								<div className="space-y-2">
									<Label
										htmlFor="name"
										className="text-gray-900 dark:text-gray-100"
									>
										Nome do Dispositivo (Opcional)
									</Label>
									<Input
										id="name"
										placeholder="Ex: Sensor da Sala 1, Medidor Norte..."
										value={formData.name}
										onChange={(e) =>
											setFormData({ ...formData, name: e.target.value })
										}
										className="bg-white dark:bg-gray-800 text-white border-gray-300 dark:border-gray-700"
									/>
									<p className="text-xs text-gray-500 dark:text-gray-400">
										Um nome amigável para identificar o dispositivo
									</p>
								</div>

								<div className="space-y-2">
									<Label
										htmlFor="boilerplate"
										className="text-gray-900 dark:text-gray-100"
									>
										Modelo de Dispositivo{" "}
										<span className="text-red-500">*</span>
									</Label>
									<Select
										value={formData.boilerplateId}
										onValueChange={handleBoilerplateChange}
									>
										<SelectTrigger
											id="boilerplate"
											className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
										>
											<SelectValue placeholder="Selecione o modelo" />
										</SelectTrigger>
										<SelectContent>
											{boilerplates.map((bp) => (
												<SelectItem key={bp.id} value={bp.id}>
													{bp.name}
													{bp.canActAsGateway && (
														<span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
															(pode ser gateway)
														</span>
													)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{selectedBoilerplate && (
										<div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs space-y-1">
											<p className="text-gray-700 dark:text-gray-300">
												<strong>Capacidades:</strong>
											</p>
											<p className="text-gray-600 dark:text-gray-400">
												Gateway:{" "}
												{selectedBoilerplate.canActAsGateway
													? "✓ Sim"
													: "✗ Não"}
											</p>
											{selectedBoilerplate.protocols.length > 0 && (
												<p className="text-gray-600 dark:text-gray-400">
													Protocolos: {selectedBoilerplate.protocols.join(", ")}
												</p>
											)}
											{selectedBoilerplate.sensors &&
												selectedBoilerplate.sensors.length > 0 && (
													<p className="text-gray-600 dark:text-gray-400">
														Sensores: {selectedBoilerplate.sensors.length}
													</p>
												)}
										</div>
									)}
								</div>

								<div className="space-y-2">
									<Label
										htmlFor="role"
										className="text-gray-900 dark:text-gray-100"
									>
										Função do Dispositivo{" "}
										<span className="text-red-500">*</span>
									</Label>
									<Select
										value={formData.role}
										onValueChange={(value: "gateway" | "node" | "self") =>
											setFormData({ ...formData, role: value })
										}
									>
										<SelectTrigger
											id="role"
											className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem
												value="gateway"
												disabled={!selectedBoilerplate?.canActAsGateway}
											>
												Gateway
												{!selectedBoilerplate?.canActAsGateway && (
													<span className="ml-2 text-xs text-gray-500">
														(não disponível)
													</span>
												)}
											</SelectItem>
											<SelectItem value="node">Nó (Node)</SelectItem>
											<SelectItem value="self">Independente (Self)</SelectItem>
										</SelectContent>
									</Select>
									<p className="text-xs text-gray-500 dark:text-gray-400">
										{formData.role === "gateway" &&
											"Coordena outros dispositivos"}
										{formData.role === "node" &&
											"Conecta através de um gateway"}
										{formData.role === "self" && "Opera de forma independente"}
									</p>
								</div>

								{formData.role === "node" && (
									<>
										<div className="space-y-2">
											<Label
												htmlFor="nodeId"
												className="text-gray-900 dark:text-gray-100"
											>
												Identificador do Nó{" "}
												<span className="text-red-500">*</span>
											</Label>
											<Input
												id="nodeId"
												placeholder="Ex: node-001, sensor-A1"
												value={formData.nodeId}
												onChange={(e) =>
													setFormData({ ...formData, nodeId: e.target.value })
												}
												className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
											/>
											<p className="text-xs text-gray-500 dark:text-gray-400">
												Identificador único para este nó na rede
											</p>
										</div>

										<div className="space-y-2">
											<Label
												htmlFor="deviceParent"
												className="text-gray-900 dark:text-gray-100"
											>
												Gateway Pai <span className="text-red-500">*</span>
											</Label>
											<Select
												value={formData.deviceParentId}
												onValueChange={(value) =>
													setFormData({ ...formData, deviceParentId: value })
												}
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

								<div className="space-y-2">
									<Label
										htmlFor="spot"
										className="text-gray-900 dark:text-gray-100"
									>
										Local (Opcional)
									</Label>
									<Select
										value={formData.spotId}
										onValueChange={(value) =>
											setFormData({ ...formData, spotId: value })
										}
									>
										<SelectTrigger
											id="spot"
											className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
										>
											<SelectValue placeholder="Nenhum local selecionado" />
										</SelectTrigger>
										<SelectContent>
											{spots.map((spot) => (
												<SelectItem key={spot.id} value={spot.id}>
													{spot.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="mac" className=" dark:text-gray-100">
										Endereço MAC <span className="text-red-500">*</span>
									</Label>
									<Input
										id="mac"
										placeholder="00:00:00:00:00:00"
										value={formData.macAddress}
										onChange={(e) =>
											setFormData({ ...formData, macAddress: e.target.value })
										}
										className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-white"
									/>
									<p className="text-xs text-gray-500 dark:text-gray-400">
										Formato aceito: XX:XX:XX:XX:XX:XX ou XXXXXXXXXXXX
									</p>
								</div>
							</>
						)}
					</div>
				</ScrollArea>

				<DialogFooter>
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
						disabled={isSaving || isLoading}
						className="bg-emerald-600 hover:bg-emerald-700 text-white"
					>
						{isSaving ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								Salvando...
							</>
						) : (
							"Cadastrar"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

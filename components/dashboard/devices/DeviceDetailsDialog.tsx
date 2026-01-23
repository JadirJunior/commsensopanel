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
} from "lucide-react";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { DeviceScenario } from "@/types/device";
import { Spot } from "@/types/spot";

interface DeviceDetailsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	device: DeviceScenario | null;
	tenantId: string;
	scenarioId: string;
	onSaved: () => void;
	mode: "view" | "edit";
}

export function DeviceDetailsDialog({
	open,
	onOpenChange,
	device,
	tenantId,
	scenarioId,
	onSaved,
	mode,
}: DeviceDetailsDialogProps) {
	const [isSaving, setIsSaving] = useState(false);
	const [spots, setSpots] = useState<Spot[]>([]);
	const [isLoadingSpots, setIsLoadingSpots] = useState(false);
	const [selectedSpotId, setSelectedSpotId] = useState<string>("");
	const [deviceName, setDeviceName] = useState<string>("");

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

	useEffect(() => {
		if (open && mode === "edit") {
			fetchSpots();
		}
		if (open && device) {
			setSelectedSpotId(device.spotId || "__none__");
			setDeviceName(device.name || "");
		}
	}, [open, mode, device, fetchSpots]);

	const handleSave = async () => {
		if (!device) return;

		try {
			setIsSaving(true);
			const spotIdToSave =
				selectedSpotId === "__none__" ? null : selectedSpotId;
			await apiService.fetchWithAuth(`/device-scenario/${device.id}`, {
				method: "PATCH",
				body: JSON.stringify({
					name: deviceName || null,
					spotId: spotIdToSave,
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

				<div className="space-y-4 py-4">
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
										<span className="text-gray-400 italic">Não vinculado</span>
									)}
								</div>
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
									className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
								/>
								<p className="text-xs text-gray-500 dark:text-gray-400">
									Um nome amigável para identificar o dispositivo
								</p>
							</div>

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
										<strong>Atenção:</strong> O dispositivo será desvinculado do
										local{" "}
										<span className="font-medium">{device.Spot?.name}</span>
									</p>
								</div>
							)}
						</>
					)}
				</div>

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

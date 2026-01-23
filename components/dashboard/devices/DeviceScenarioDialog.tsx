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
	const [formData, setFormData] = useState({
		boilerplateId: "",
		name: "",
		spotId: "",
		macAddress: "",
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

	useEffect(() => {
		if (open) {
			fetchBoilerplates();
			fetchSpots();
			setFormData({
				boilerplateId: "",
				name: "",
				spotId: "",
				macAddress: "",
			});
		}
	}, [open, fetchBoilerplates, fetchSpots]);

	const handleSave = async () => {
		if (!formData.boilerplateId || !formData.macAddress) {
			toast.error("Preencha todos os campos obrigatórios.");
			return;
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

				<div className="space-y-4 py-4">
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
									className="bg-white dark:bg-gray-800 text-gray-100 border-gray-300 dark:border-gray-700"
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
									Modelo de Dispositivo <span className="text-red-500">*</span>
								</Label>
								<Select
									value={formData.boilerplateId}
									onValueChange={(value) =>
										setFormData({ ...formData, boilerplateId: value })
									}
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
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

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

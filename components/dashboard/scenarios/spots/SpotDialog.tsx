"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Spot, CreateSpotDTO, UpdateSpotDTO } from "@/types/spot";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamic import for the map to avoid SSR issues
const SpotPickerMap = dynamic(() => import("./SpotPickerMap"), {
	ssr: false,
	loading: () => <Skeleton className="h-[300px] w-full rounded-md" />,
});

interface SpotDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	scenarioId: string;
	tenantId: string;
	editingSpot: Spot | null;
	onSaved: () => void;
}

export function SpotDialog({
	open,
	onOpenChange,
	scenarioId,
	tenantId,
	editingSpot,
	onSaved,
}: SpotDialogProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [valid, setValid] = useState(false);
	const [weight, setWeight] = useState<string>("");
	const [latitude, setLatitude] = useState<number | undefined>(undefined);
	const [longitude, setLongitude] = useState<number | undefined>(undefined);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (open) {
			if (editingSpot) {
				setName(editingSpot.name);
				setDescription(editingSpot.description || "");
				setValid(editingSpot.valid);
				setWeight(editingSpot.weight?.toString() || "");
				setLatitude(
					editingSpot.latitude ? Number(editingSpot.latitude) : undefined
				);
				setLongitude(
					editingSpot.longitude ? Number(editingSpot.longitude) : undefined
				);
			} else {
				setName("");
				setDescription("");
				setValid(false);
				setWeight("");
				setLatitude(undefined);
				setLongitude(undefined);
			}
		}
	}, [open, editingSpot]);

	const handleLocationSelect = (lat: number, lng: number) => {
		setLatitude(lat);
		setLongitude(lng);
	};

	const handleSave = async () => {
		if (!name.trim()) {
			toast.error("O nome do spot é obrigatório.");
			return;
		}

		if (!scenarioId) {
			toast.error("Erro interno: ID do cenário não encontrado.");
			return;
		}

		setIsSaving(true);

		try {
			const payload: CreateSpotDTO = {
				name,
				description,
				valid,
				weight: weight ? parseFloat(weight) : undefined,
				latitude,
				longitude,
				scenarioId,
			};

			const headers = {
				"x-scenario-id": scenarioId,
				"x-tenant-id": tenantId,
			};

			if (editingSpot) {
				await apiService.fetchWithAuth(`/spot/${editingSpot.id}`, {
					method: "PUT",
					headers,
					body: JSON.stringify({
						...payload,
						spotId: editingSpot.id,
					} as UpdateSpotDTO),
				});
				toast.success("Spot atualizado com sucesso!");
			} else {
				await apiService.fetchWithAuth("/spot", {
					method: "POST",
					headers,
					body: JSON.stringify(payload),
				});
				toast.success("Spot criado com sucesso!");
			}

			onSaved();
			onOpenChange(false);
		} catch (error) {
			console.error("Erro ao salvar spot:", error);
			toast.error(
				error instanceof Error ? error.message : "Erro ao salvar spot."
			);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
				<DialogHeader>
					<DialogTitle>{editingSpot ? "Editar Spot" : "Novo Spot"}</DialogTitle>
					<DialogDescription>
						Preencha os dados do spot de medição.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="name">Nome</Label>
						<Input
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Ex: Sensor Hall de Entrada"
						/>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="description">Descrição</Label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Descrição opcional do local..."
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="grid gap-2">
							<Label htmlFor="weight">Peso (Opcional)</Label>
							<Input
								id="weight"
								type="number"
								step="0.1"
								value={weight}
								onChange={(e) => setWeight(e.target.value)}
								placeholder="1.0"
							/>
						</div>
						<div className="flex items-end pb-2">
							<div className="flex items-center space-x-2">
								<Checkbox
									id="valid"
									checked={valid}
									onCheckedChange={(checked) => setValid(checked as boolean)}
								/>
								<Label htmlFor="valid" className="cursor-pointer">
									Spot Válido/Ativo
								</Label>
							</div>
						</div>
					</div>

					<div className="grid gap-2">
						<Label>Localização</Label>
						<div className="grid grid-cols-2 gap-2 mb-2">
							<Input
								placeholder="Latitude"
								value={latitude ?? ""}
								readOnly
								className="bg-gray-50 dark:bg-gray-900"
							/>
							<Input
								placeholder="Longitude"
								value={longitude ?? ""}
								readOnly
								className="bg-gray-50 dark:bg-gray-900"
							/>
						</div>
						<SpotPickerMap
							latitude={latitude}
							longitude={longitude}
							onLocationSelect={handleLocationSelect}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isSaving}
					>
						Cancelar
					</Button>
					<Button onClick={handleSave} disabled={isSaving}>
						{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Salvar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

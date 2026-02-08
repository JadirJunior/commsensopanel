"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	MoreHorizontal,
	Plus,
	Pencil,
	Trash2,
	Copy,
	Box,
	Cpu,
	Gauge,
	Eye,
	Loader2,
	AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { apiService } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import { SensorCard } from "./SensorCard";
import { ScrollArea } from "@/components/ui/scroll-area";

// Tipos da API
interface SensorCategory {
	id: string;
	name: string;
	unit: string;
}

interface Sensor {
	id: string;
	deviceId: string;
	categoryId: string;
	Category: SensorCategory;
}

interface Device {
	id: string;
	name: string;
	enabled: boolean;
	canActAsGateway?: boolean;
	protocols?: string[];
	sensors: Sensor[];
}

// Tipos para o formulário
interface SensorFormData {
	id?: string; // Se existir, é um sensor existente (para update)
	categoryId?: string;
	categoryName: string;
	categoryUnit: string;
}

export function BoilerplatesTab() {
	const [devices, setDevices] = useState<Device[]>([]);
	const [categories, setCategories] = useState<SensorCategory[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingDevice, setEditingDevice] = useState<Device | null>(null);
	const [viewingDevice, setViewingDevice] = useState<Device | null>(null);
	const [deleteConfirm, setDeleteConfirm] = useState<Device | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	// Form state
	const [formData, setFormData] = useState({
		name: "",
		canActAsGateway: false,
		protocols: "" as string,
		sensors: [] as SensorFormData[],
	});

	// Estado para adicionar novo sensor
	const [newSensorMode, setNewSensorMode] = useState<"existing" | "new">(
		"existing",
	);
	const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
	const [newCategoryName, setNewCategoryName] = useState("");
	const [newCategoryUnit, setNewCategoryUnit] = useState("");

	// Carregar dispositivos e categorias ao montar
	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			setIsLoading(true);
			const [devicesRes, categoriesRes] = await Promise.all([
				apiService.fetchWithAuth<Device[]>("/devices"),
				apiService.fetchWithAuth<SensorCategory[]>("/sensor-categories"),
			]);

			if (devicesRes.data) {
				setDevices(devicesRes.data);
			}
			if (categoriesRes.data) {
				setCategories(categoriesRes.data);
			}
		} catch (error) {
			toast.error("Erro ao carregar dados");
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCreate = () => {
		setEditingDevice(null);
		setFormData({
			name: "",
			canActAsGateway: false,
			protocols: "",
			sensors: [],
		});
		resetNewSensorForm();
		setIsDialogOpen(true);
	};

	const handleEdit = (device: Device) => {
		setEditingDevice(device);
		setFormData({
			name: device.name,
			canActAsGateway: device.canActAsGateway || false,
			protocols: device.protocols?.join(", ") || "",
			sensors: device.sensors.map((s) => ({
				id: s.id,
				categoryId: s.categoryId,
				categoryName: s.Category.name,
				categoryUnit: s.Category.unit,
			})),
		});
		resetNewSensorForm();
		setIsDialogOpen(true);
	};

	const handleDuplicate = (device: Device) => {
		setEditingDevice(null);
		setFormData({
			name: `${device.name} (Cópia)`,
			canActAsGateway: device.canActAsGateway || false,
			protocols: device.protocols?.join(", ") || "",
			sensors: device.sensors.map((s) => ({
				// Usa categoryId para referenciar categoria existente
				categoryId: s.categoryId,
				categoryName: s.Category.name,
				categoryUnit: s.Category.unit,
			})),
		});
		resetNewSensorForm();
		setIsDialogOpen(true);
	};

	const resetNewSensorForm = () => {
		setNewSensorMode("existing");
		setSelectedCategoryId("");
		setNewCategoryName("");
		setNewCategoryUnit("");
	};

	const handleAddSensor = () => {
		if (newSensorMode === "existing") {
			if (!selectedCategoryId) {
				toast.error("Selecione uma categoria de sensor");
				return;
			}

			const category = categories.find((c) => c.id === selectedCategoryId);
			if (!category) return;

			// Verifica se já existe um sensor com essa categoria
			const exists = formData.sensors.some(
				(s) => s.categoryId === selectedCategoryId,
			);
			if (exists) {
				toast.error("Esta categoria já foi adicionada");
				return;
			}

			const sensor: SensorFormData = {
				categoryId: category.id,
				categoryName: category.name,
				categoryUnit: category.unit,
			};

			setFormData((prev) => ({
				...prev,
				sensors: [...prev.sensors, sensor],
			}));
		} else {
			if (!newCategoryName.trim()) {
				toast.error("Preencha o nome da categoria");
				return;
			}

			const sensor: SensorFormData = {
				categoryName: newCategoryName.trim(),
				categoryUnit: newCategoryUnit.trim(),
			};

			setFormData((prev) => ({
				...prev,
				sensors: [...prev.sensors, sensor],
			}));
		}

		resetNewSensorForm();
	};

	const handleRemoveSensor = (index: number) => {
		setFormData((prev) => ({
			...prev,
			sensors: prev.sensors.filter((_, i) => i !== index),
		}));
	};

	const handleSave = async () => {
		if (!formData.name.trim()) {
			toast.error("Preencha o nome do dispositivo");
			return;
		}

		// Validação: sensores obrigatórios apenas para dispositivos que não são gateway
		if (!formData.canActAsGateway && formData.sensors.length === 0) {
			toast.error("Adicione pelo menos um sensor ou marque como gateway");
			return;
		}

		setIsSaving(true);

		try {
			if (editingDevice) {
				// Atualizar dispositivo existente
				const protocols = formData.protocols
					.split(",")
					.map((p) => p.trim())
					.filter((p) => p.length > 0);

				const updatePayload = {
					id: editingDevice.id,
					name: formData.name,
					canActAsGateway: formData.canActAsGateway,
					protocols,
					sensors: formData.sensors.map((s) => {
						if (s.id) {
							// Sensor existente - apenas manter
							return { id: s.id };
						}
						// Novo sensor - pode ter categoryId ou categoryName/categoryUnit
						if (s.categoryId) {
							return { categoryId: s.categoryId };
						}
						return {
							categoryName: s.categoryName,
							categoryUnit: s.categoryUnit,
						};
					}),
				};

				await apiService.fetchWithAuth<Device>("/devices", {
					method: "PUT",
					body: JSON.stringify(updatePayload),
				});

				toast.success("Dispositivo atualizado com sucesso!");
			} else {
				// Criar novo dispositivo
				const protocols = formData.protocols
					.split(",")
					.map((p) => p.trim())
					.filter((p) => p.length > 0);

				const createPayload = {
					name: formData.name,
					canActAsGateway: formData.canActAsGateway,
					protocols,
					sensors: formData.sensors.map((s) => {
						if (s.categoryId) {
							return { categoryId: s.categoryId };
						}
						return {
							categoryName: s.categoryName,
							categoryUnit: s.categoryUnit,
						};
					}),
				};

				await apiService.fetchWithAuth<Device>("/devices", {
					method: "POST",
					body: JSON.stringify(createPayload),
				});

				toast.success("Dispositivo criado com sucesso!");
			}

			setIsDialogOpen(false);
			loadData(); // Recarrega também as categorias caso uma nova tenha sido criada
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Erro ao salvar dispositivo";
			toast.error(message);
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!deleteConfirm) return;

		setIsDeleting(true);

		try {
			await apiService.fetchWithAuth(`/devices/${deleteConfirm.id}`, {
				method: "DELETE",
			});

			toast.success("Dispositivo removido com sucesso!");
			setDeleteConfirm(null);
			loadData();
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Erro ao excluir dispositivo";
			toast.error(message);
		} finally {
			setIsDeleting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
						Templates de Dispositivos
					</h3>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Configure os modelos padrão para criação de novos dispositivos IoT
					</p>
				</div>
				<Button onClick={handleCreate} className="gap-2">
					<Plus className="w-4 h-4" />
					Novo Dispositivo
				</Button>
			</div>

			{/* Cards Grid */}
			{devices.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{devices.map((device) => (
						<Card
							key={device.id}
							className="group hover:shadow-md transition-all duration-200 cursor-pointer bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
							onClick={() => setViewingDevice(device)}
						>
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
											<Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
										</div>
										<div>
											<CardTitle className="text-base line-clamp-1 text-gray-900 dark:text-white">
												{device.name}
											</CardTitle>
											<div className="flex items-center gap-2 mt-1 flex-wrap">
												<Badge
													variant={device.enabled ? "default" : "secondary"}
													className="text-xs"
												>
													{device.enabled ? "Ativo" : "Inativo"}
												</Badge>
												{device.canActAsGateway && (
													<Badge
														variant="outline"
														className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
													>
														Gateway
													</Badge>
												)}
											</div>
										</div>
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger
											asChild
											onClick={(e) => e.stopPropagation()}
										>
											<Button variant="ghost" size="icon" className="h-8 w-8">
												<MoreHorizontal className="w-4 h-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuLabel>Ações</DropdownMenuLabel>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={(e) => {
													e.stopPropagation();
													setViewingDevice(device);
												}}
											>
												<Eye className="w-4 h-4 mr-2" />
												Visualizar
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={(e) => {
													e.stopPropagation();
													handleEdit(device);
												}}
											>
												<Pencil className="w-4 h-4 mr-2" />
												Editar
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={(e) => {
													e.stopPropagation();
													handleDuplicate(device);
												}}
											>
												<Copy className="w-4 h-4 mr-2" />
												Duplicar
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												className="text-red-600 dark:text-red-400"
												onClick={(e) => {
													e.stopPropagation();
													setDeleteConfirm(device);
												}}
											>
												<Trash2 className="w-4 h-4 mr-2" />
												Excluir
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</CardHeader>
							<CardContent className="pt-0">
								<div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 mb-2">
									<Gauge className="w-3 h-3" />
									{device.sensors.length} sensor
									{device.sensors.length !== 1 ? "es" : ""}
								</div>
								{device.protocols && device.protocols.length > 0 && (
									<div className="flex flex-wrap gap-1 mb-2">
										{device.protocols.slice(0, 3).map((protocol, idx) => (
											<Badge
												key={idx}
												variant="outline"
												className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
											>
												{protocol}
											</Badge>
										))}
										{device.protocols.length > 3 && (
											<Badge
												variant="outline"
												className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
											>
												+{device.protocols.length - 3}
											</Badge>
										)}
									</div>
								)}
								{device.sensors.length > 0 && (
									<div className="flex flex-wrap gap-1 mt-2">
										{device.sensors.slice(0, 3).map((sensor) => (
											<Badge
												key={sensor.id}
												variant="outline"
												className="text-xs text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
											>
												{sensor.Category.name}
												{sensor.Category.unit && ` (${sensor.Category.unit})`}
											</Badge>
										))}
										{device.sensors.length > 3 && (
											<Badge
												variant="outline"
												className="text-xs text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
											>
												+{device.sensors.length - 3}
											</Badge>
										)}
									</div>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
					<Box className="w-12 h-12 text-gray-300 mx-auto mb-4" />
					<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
						Nenhum dispositivo cadastrado
					</h3>
					<p className="text-gray-500 dark:text-gray-400 mt-1 mb-4">
						Crie templates para padronizar a criação de dispositivos
					</p>
					<Button onClick={handleCreate}>
						<Plus className="w-4 h-4 mr-2" />
						Criar primeiro dispositivo
					</Button>
				</div>
			)}

			{/* View Dialog */}
			<Dialog
				open={!!viewingDevice}
				onOpenChange={() => setViewingDevice(null)}
			>
				<DialogContent className="sm:max-w-[600px] overflow-hidden  bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
					{viewingDevice && (
						<>
							<DialogHeader>
								<div className="flex items-center gap-3">
									<div className="w-12 h-12 rounded-lg bg-emerald-100  flex items-center justify-center">
										<Cpu className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
									</div>
									<div>
										<DialogTitle>{viewingDevice.name}</DialogTitle>
										<DialogDescription className="flex items-center gap-2 mt-1">
											<Badge
												variant={
													viewingDevice.enabled ? "default" : "secondary"
												}
											>
												{viewingDevice.enabled ? "Ativo" : "Inativo"}
											</Badge>
										</DialogDescription>
									</div>
								</div>
							</DialogHeader>
							<ScrollArea className="max-h-96">
								<div className="space-y-4 py-4">
									<div>
										<h4 className="text-sm font-semibold   mb-3">
											Sensores Configurados ({viewingDevice.sensors.length})
										</h4>
										<div className="space-y-2">
											{viewingDevice.sensors.map((sensor) => (
												<SensorCard
													key={sensor.id}
													name={sensor.Category.name}
													unit={sensor.Category.unit}
													id={sensor.id}
													variant="view"
												/>
											))}
										</div>
									</div>
								</div>
							</ScrollArea>
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => setViewingDevice(null)}
								>
									Fechar
								</Button>
								<Button
									onClick={() => {
										handleEdit(viewingDevice);
										setViewingDevice(null);
									}}
								>
									<Pencil className="w-4 h-4 mr-2" />
									Editar
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>

			{/* Create/Edit Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
					<DialogHeader>
						<DialogTitle>
							{editingDevice ? "Editar Dispositivo" : "Novo Dispositivo"}
						</DialogTitle>
						<DialogDescription>
							{editingDevice
								? "Modifique as configurações do dispositivo"
								: "Configure um novo template de dispositivo"}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-6 py-4">
						{/* Nome */}
						<div>
							<Label htmlFor="name">Nome do Dispositivo *</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, name: e.target.value }))
								}
								placeholder="Ex: Sensor Ambiental Completo"
							/>
						</div>

						{/* Gateway Capability */}
						<div className="space-y-2">
							<div className="flex items-center space-x-2">
								<Checkbox
									id="canActAsGateway"
									checked={formData.canActAsGateway}
									onCheckedChange={(checked) =>
										setFormData((prev) => ({
											...prev,
											canActAsGateway: checked as boolean,
										}))
									}
								/>
								<Label
									htmlFor="canActAsGateway"
									className="text-sm font-medium cursor-pointer"
								>
									Este dispositivo pode atuar como Gateway
								</Label>
							</div>
							<p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
								Gateways podem coordenar outros dispositivos e não necessitam de
								sensores
							</p>
						</div>

						{/* Protocols */}
						<div>
							<Label htmlFor="protocols">
								Protocolos Suportados (Opcional)
							</Label>
							<Input
								id="protocols"
								value={formData.protocols}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										protocols: e.target.value,
									}))
								}
								placeholder="Ex: MQTT, Zigbee, LoRa, WiFi"
							/>
							<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
								Separe múltiplos protocolos por vírgula
							</p>
						</div>

						{/* Sensores */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<Label className="text-base font-semibold text-gray-900 dark:text-white">
									Sensores
								</Label>
								<Badge variant="secondary">
									{formData.sensors.length} configurados
								</Badge>
							</div>

							{/* Lista de Sensores */}
							{formData.sensors.length > 0 && (
								<div className="space-y-2 mb-4">
									{formData.sensors.map((sensor, index) => {
										// Define a variante baseada no tipo de sensor
										const isExisting = !!sensor.id;
										const isExistingCategory =
											!sensor.id && !!sensor.categoryId;

										const variant = isExisting
											? "existing"
											: isExistingCategory
												? "existing-category"
												: "new-category";

										return (
											<SensorCard
												key={sensor.id || index}
												name={sensor.categoryName}
												unit={sensor.categoryUnit}
												variant={variant}
												showStatus
												onRemove={() => handleRemoveSensor(index)}
											/>
										);
									})}
								</div>
							)}

							{/* Formulário para adicionar sensor */}
							<div className="p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg space-y-4">
								<p className="text-sm font-medium text-gray-700 dark:text-gray-300">
									Adicionar Sensor
								</p>

								{/* Tabs para escolher modo */}
								<div className="flex gap-4">
									<label className="flex items-center gap-2 cursor-pointer">
										<Checkbox
											checked={newSensorMode === "existing"}
											onCheckedChange={() => setNewSensorMode("existing")}
										/>
										<span className="text-sm">Categoria existente</span>
									</label>
									<label className="flex items-center gap-2 cursor-pointer">
										<Checkbox
											checked={newSensorMode === "new"}
											onCheckedChange={() => setNewSensorMode("new")}
										/>
										<span className="text-sm">Nova categoria</span>
									</label>
								</div>

								{newSensorMode === "existing" ? (
									<div>
										<Label htmlFor="categorySelect" className="text-xs">
											Selecione a Categoria
										</Label>
										<Select
											value={selectedCategoryId}
											onValueChange={setSelectedCategoryId}
										>
											<SelectTrigger className="h-9">
												<SelectValue placeholder="Selecione uma categoria..." />
											</SelectTrigger>
											<SelectContent>
												{categories.length === 0 ? (
													<div className="p-2 text-sm text-gray-500">
														Nenhuma categoria disponível
													</div>
												) : (
													categories.map((cat) => (
														<SelectItem key={cat.id} value={cat.id}>
															{cat.name}
															{cat.unit && ` (${cat.unit})`}
														</SelectItem>
													))
												)}
											</SelectContent>
										</Select>
									</div>
								) : (
									<div className="grid grid-cols-2 gap-3">
										<div>
											<Label htmlFor="newCategoryName" className="text-xs">
												Nome da Categoria *
											</Label>
											<Input
												id="newCategoryName"
												value={newCategoryName}
												onChange={(e) => setNewCategoryName(e.target.value)}
												placeholder="Ex: pH, Temperatura"
												className="h-9"
											/>
										</div>
										<div>
											<Label htmlFor="newCategoryUnit" className="text-xs">
												Unidade (opcional)
											</Label>
											<Input
												id="newCategoryUnit"
												value={newCategoryUnit}
												onChange={(e) => setNewCategoryUnit(e.target.value)}
												placeholder="Ex: °C, %, V"
												className="h-9"
											/>
										</div>
									</div>
								)}

								<Button
									type="button"
									variant="secondary"
									className="w-full"
									onClick={handleAddSensor}
								>
									<Plus className="w-4 h-4 mr-2" />
									Adicionar Sensor
								</Button>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsDialogOpen(false)}
							disabled={isSaving}
						>
							Cancelar
						</Button>
						<Button onClick={handleSave} disabled={isSaving}>
							{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
							{editingDevice ? "Salvar Alterações" : "Criar Dispositivo"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog
				open={!!deleteConfirm}
				onOpenChange={() => setDeleteConfirm(null)}
			>
				<DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<AlertTriangle className="w-5 h-5 text-red-500" />
							Confirmar Exclusão
						</DialogTitle>
						<DialogDescription>
							Tem certeza que deseja excluir o dispositivo{" "}
							<span className="font-medium text-gray-900 dark:text-gray-100">
								{deleteConfirm?.name}
							</span>
							? Esta ação não pode ser desfeita.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteConfirm(null)}
							disabled={isDeleting}
						>
							Cancelar
						</Button>
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={isDeleting}
						>
							{isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
							Excluir
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

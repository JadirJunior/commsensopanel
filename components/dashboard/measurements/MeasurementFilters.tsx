"use client";

import { useState, useMemo } from "react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { FilterMeasurementsDTO } from "@/types/measurement";
import { DeviceScenario, Sensor } from "@/types/device";
import { Search, X, Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

dayjs.locale("pt-br");

interface MeasurementFiltersProps {
	onFilter: (filters: FilterMeasurementsDTO) => void;
	devices: DeviceScenario[];
	isLoading?: boolean;
}

type PeriodOption = "1h" | "6h" | "12h" | "24h" | "7d" | "30d" | "custom";

const periodOptions: { value: PeriodOption; label: string }[] = [
	{ value: "1h", label: "Última hora" },
	{ value: "6h", label: "Últimas 6 horas" },
	{ value: "12h", label: "Últimas 12 horas" },
	{ value: "24h", label: "Últimas 24 horas" },
	{ value: "7d", label: "Últimos 7 dias" },
	{ value: "30d", label: "Últimos 30 dias" },
	{ value: "custom", label: "Período personalizado" },
];

export function MeasurementFilters({
	onFilter,
	devices,
	isLoading = false,
}: MeasurementFiltersProps) {
	const [period, setPeriod] = useState<PeriodOption>("24h");
	const [dtStart, setDtStart] = useState<Date | undefined>(undefined);
	const [dtEnd, setDtEnd] = useState<Date | undefined>(undefined);
	const [selectedSpotId, setSelectedSpotId] = useState<string>("all");
	const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
	// Agora armazena categoryIds ao invés de sensorIds individuais
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [showFilters, setShowFilters] = useState(true);

	// Lista única de spots disponíveis (extraídos dos dispositivos)
	const availableSpots = useMemo(() => {
		const spotMap = new Map<string, { id: string; name: string }>();
		devices.forEach((device) => {
			if (device.Spot && !spotMap.has(device.Spot.id)) {
				spotMap.set(device.Spot.id, {
					id: device.Spot.id,
					name: device.Spot.name,
				});
			}
		});
		return Array.from(spotMap.values());
	}, [devices]);

	// Dispositivos filtrados pelo spot selecionado
	const filteredDevices = useMemo(() => {
		if (selectedSpotId === "all") {
			return devices;
		}
		return devices.filter((d) => d.spotId === selectedSpotId);
	}, [devices, selectedSpotId]);

	// Limpa seleção de dispositivos quando muda o spot
	const handleSpotChange = (spotId: string) => {
		setSelectedSpotId(spotId);
		setSelectedDevices([]);
		setSelectedCategories([]);
	};

	// Mapa de sensores por dispositivo
	const sensorsByDevice = useMemo(() => {
		const map = new Map<string, Sensor[]>();
		devices.forEach((device) => {
			const sensors = device.Device?.sensors || [];
			map.set(device.id, sensors);
		});
		return map;
	}, [devices]);

	// Lista única de categorias de sensores disponíveis (de todos os dispositivos selecionados)
	const availableCategories = useMemo(() => {
		const categoryMap = new Map<
			string,
			{ id: string; name: string; unit: string }
		>();
		selectedDevices.forEach((deviceId) => {
			const sensors = sensorsByDevice.get(deviceId) || [];
			sensors.forEach((sensor) => {
				if (sensor.Category && !categoryMap.has(sensor.Category.id)) {
					categoryMap.set(sensor.Category.id, {
						id: sensor.Category.id,
						name: sensor.Category.name,
						unit: sensor.Category.unit,
					});
				}
			});
		});
		return Array.from(categoryMap.values());
	}, [selectedDevices, sensorsByDevice]);

	// Calcula os sensorIds baseado nas categorias selecionadas e dispositivos selecionados
	const selectedSensorIds = useMemo(() => {
		const sensorIds: string[] = [];
		selectedDevices.forEach((deviceId) => {
			const sensors = sensorsByDevice.get(deviceId) || [];
			sensors.forEach((sensor) => {
				if (
					sensor.Category &&
					selectedCategories.includes(sensor.Category.id)
				) {
					sensorIds.push(sensor.id);
				}
			});
		});
		return sensorIds;
	}, [selectedDevices, selectedCategories, sensorsByDevice]);

	const handleDeviceToggle = (deviceId: string) => {
		setSelectedDevices((prev) =>
			prev.includes(deviceId)
				? prev.filter((id) => id !== deviceId)
				: [...prev, deviceId],
		);
	};

	const handleCategoryToggle = (categoryId: string) => {
		setSelectedCategories((prev) =>
			prev.includes(categoryId)
				? prev.filter((id) => id !== categoryId)
				: [...prev, categoryId],
		);
	};

	const handleSelectAllCategories = () => {
		if (selectedCategories.length === availableCategories.length) {
			setSelectedCategories([]);
		} else {
			setSelectedCategories(availableCategories.map((c) => c.id));
		}
	};

	const handleSelectAllDevices = () => {
		if (selectedDevices.length === filteredDevices.length) {
			setSelectedDevices([]);
			setSelectedCategories([]);
		} else {
			setSelectedDevices(filteredDevices.map((d) => d.id));
		}
	};

	const handleRangeChange = (
		start: Date | undefined,
		end: Date | undefined,
	) => {
		setDtStart(start);
		setDtEnd(end);
	};

	const handleFilter = () => {
		// Validação: exige seleção de dispositivos
		if (selectedDevices.length === 0) {
			toast.error("Selecione pelo menos um dispositivo");
			return;
		}

		// Validação: exige seleção de tipos de sensores
		if (selectedCategories.length === 0) {
			toast.error("Selecione pelo menos um tipo de sensor");
			return;
		}

		const filters: FilterMeasurementsDTO = {
			orderBy: {
				field: "dtMeasure",
				direction: "asc",
			},
		};

		if (period !== "custom") {
			filters.period = period;
		} else {
			if (dtStart) filters.dtStart = dayjs(dtStart).toISOString();
			if (dtEnd) filters.dtEnd = dayjs(dtEnd).toISOString();
		}

		filters.deviceIds = selectedDevices;
		filters.sensorIds = selectedSensorIds;

		onFilter(filters);
	};

	const handleClearFilters = () => {
		setPeriod("24h");
		setDtStart(undefined);
		setDtEnd(undefined);
		setSelectedSpotId("all");
		setSelectedDevices([]);
		setSelectedCategories([]);
	};

	return (
		<div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<Filter className="w-5 h-5 text-emerald-600" />
					<h3 className="font-semibold text-gray-900 dark:text-white">
						Filtros
					</h3>
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setShowFilters(!showFilters)}
				>
					{showFilters ? "Ocultar" : "Mostrar"}
				</Button>
			</div>

			{showFilters && (
				<div className="space-y-4">
					{/* Período */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label htmlFor="period">Período</Label>
							<Select
								value={period}
								onValueChange={(v) => setPeriod(v as PeriodOption)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecione o período" />
								</SelectTrigger>
								<SelectContent>
									{periodOptions.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{period === "custom" && (
							<div className="space-y-2 md:col-span-2">
								<Label>Período personalizado</Label>
								<DateRangePicker
									startDate={dtStart}
									endDate={dtEnd}
									onRangeChange={handleRangeChange}
									placeholder="Selecione o período"
									showTime={true}
								/>
							</div>
						)}
					</div>

					{/* Spot e Dispositivos */}
					{devices.length > 0 && (
						<div className="space-y-4">
							{/* Seletor de Spot */}
							{availableSpots.length > 0 && (
								<div className="space-y-2">
									<Label>Spot (Local)</Label>
									<Select
										value={selectedSpotId}
										onValueChange={handleSpotChange}
									>
										<SelectTrigger className="max-w-xs">
											<SelectValue placeholder="Selecione um spot" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">Todos os spots</SelectItem>
											{availableSpots.map((spot) => (
												<SelectItem key={spot.id} value={spot.id}>
													{spot.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{selectedSpotId !== "all" && (
										<p className="text-xs text-gray-500 dark:text-gray-400">
											Mostrando {filteredDevices.length} dispositivo(s) do spot
											selecionado
										</p>
									)}
								</div>
							)}

							{/* Dispositivos */}
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label>Dispositivos</Label>
									<Button
										variant="ghost"
										size="sm"
										onClick={handleSelectAllDevices}
										className="text-xs"
									>
										{selectedDevices.length === filteredDevices.length &&
										filteredDevices.length > 0
											? "Desmarcar todos"
											: "Selecionar todos"}
									</Button>
								</div>
								<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
									{filteredDevices.map((device) => {
										const sensors = sensorsByDevice.get(device.id) || [];
										const isSelected = selectedDevices.includes(device.id);

										return (
											<div
												key={device.id}
												className="flex items-center space-x-2"
											>
												<Checkbox
													id={`device-${device.id}`}
													checked={isSelected}
													onCheckedChange={() => handleDeviceToggle(device.id)}
												/>
												<label
													htmlFor={`device-${device.id}`}
													className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer truncate"
													title={`${device.name || device.macAddress} (${sensors.length} sensores)`}
												>
													{device.name || device.macAddress}
												</label>
											</div>
										);
									})}
								</div>
								{selectedDevices.length > 0 && (
									<p className="text-xs text-gray-500 dark:text-gray-400">
										{selectedDevices.length} dispositivo(s) selecionado(s)
									</p>
								)}
							</div>

							{/* Categorias de Sensores (aparecem após selecionar dispositivos) */}
							{selectedDevices.length > 0 && availableCategories.length > 0 && (
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<Label>Tipos de Sensores</Label>
										<Button
											variant="ghost"
											size="sm"
											onClick={handleSelectAllCategories}
											className="text-xs"
										>
											{selectedCategories.length === availableCategories.length
												? "Desmarcar todos"
												: "Selecionar todos"}
										</Button>
									</div>
									<p className="text-xs text-gray-500 dark:text-gray-400">
										Selecione os tipos de sensores para filtrar. A seleção será
										aplicada a todos os dispositivos que possuem esse tipo.
									</p>
									<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
										{availableCategories.map((category) => {
											const isSelected = selectedCategories.includes(
												category.id,
											);
											// Conta quantos dispositivos selecionados têm este tipo de sensor
											const deviceCount = selectedDevices.filter((deviceId) => {
												const sensors = sensorsByDevice.get(deviceId) || [];
												return sensors.some(
													(s) => s.Category?.id === category.id,
												);
											}).length;

											return (
												<div
													key={category.id}
													className="flex items-center space-x-2"
												>
													<Checkbox
														id={`category-${category.id}`}
														checked={isSelected}
														onCheckedChange={() =>
															handleCategoryToggle(category.id)
														}
													/>
													<label
														htmlFor={`category-${category.id}`}
														className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer truncate"
														title={`${category.name} (${category.unit}) - ${deviceCount} dispositivo(s)`}
													>
														{category.name}{" "}
														{category.unit && `(${category.unit})`}
														<span className="text-xs text-gray-400 ml-1">
															[{deviceCount}]
														</span>
													</label>
												</div>
											);
										})}
									</div>
									{selectedCategories.length > 0 && (
										<p className="text-xs text-gray-500 dark:text-gray-400">
											{selectedCategories.length} tipo(s) de sensor
											selecionado(s) → {selectedSensorIds.length} sensor(es)
											total
										</p>
									)}
								</div>
							)}
						</div>
					)}

					{/* Ações */}
					<div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
						<Button
							onClick={handleFilter}
							disabled={isLoading}
							className="bg-emerald-600 hover:bg-emerald-700 text-white"
						>
							<Search className="w-4 h-4 mr-2" />
							{isLoading ? "Buscando..." : "Buscar"}
						</Button>
						<Button variant="outline" onClick={handleClearFilters}>
							<X className="w-4 h-4 mr-2" />
							Limpar filtros
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

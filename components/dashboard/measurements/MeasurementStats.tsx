"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DeviceStatistics, Measurement } from "@/types/measurement";
import { DeviceScenario, Sensor } from "@/types/device";
import {
	TrendingUp,
	TrendingDown,
	Activity,
	Cpu,
	ChevronRight,
	LineChart,
} from "lucide-react";

interface MeasurementStatsProps {
	statistics: DeviceStatistics;
	devices: DeviceScenario[];
	measurements: Measurement[];
}

export function MeasurementStats({
	statistics,
	devices,
	measurements,
}: MeasurementStatsProps) {
	const [selectedDeviceId, setSelectedDeviceId] = useState<string>("all");

	// Mapeia dispositivos por ID para acesso rápido
	const devicesMap = useMemo(() => {
		const map = new Map<string, DeviceScenario>();
		devices.forEach((d) => map.set(d.id, d));
		return map;
	}, [devices]);

	// Mapeia sensores por ID para acesso rápido (a partir das medições)
	const sensorsMap = useMemo(() => {
		const map = new Map<
			string,
			{ id: string; name: string; unit: string; categoryId: string }
		>();
		measurements.forEach((m) => {
			if (m.Sensor && m.Sensor.Category && !map.has(m.sensorId)) {
				map.set(m.sensorId, {
					id: m.sensorId,
					name: m.Sensor.Category.name,
					unit: m.Sensor.Category.unit,
					categoryId: m.Sensor.Category.id,
				});
			}
		});
		return map;
	}, [measurements]);

	// Lista de dispositivos que têm estatísticas
	const devicesWithStats = useMemo(() => {
		return Object.keys(statistics)
			.map((deviceId) => devicesMap.get(deviceId))
			.filter(Boolean) as DeviceScenario[];
	}, [statistics, devicesMap]);

	// Estatísticas filtradas pelo dispositivo selecionado
	const filteredStats = useMemo(() => {
		if (selectedDeviceId === "all") {
			return statistics;
		}
		if (statistics[selectedDeviceId]) {
			return { [selectedDeviceId]: statistics[selectedDeviceId] };
		}
		return {};
	}, [statistics, selectedDeviceId]);

	// Verifica se há estatísticas
	const hasStats = Object.keys(statistics).length > 0;

	if (!hasStats) {
		return null;
	}

	return (
		<Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
			<CardHeader>
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
						<Activity className="w-5 h-5 text-emerald-600" />
						Estatísticas por Dispositivo
					</CardTitle>

					<div className="flex items-center gap-2">
						<span className="text-sm text-gray-500 dark:text-gray-400">
							Dispositivo:
						</span>
						<Select
							value={selectedDeviceId}
							onValueChange={setSelectedDeviceId}
						>
							<SelectTrigger className="w-[200px]">
								<SelectValue placeholder="Selecione um dispositivo" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos os dispositivos</SelectItem>
								{devicesWithStats.map((device) => (
									<SelectItem key={device.id} value={device.id}>
										{device.name || device.macAddress}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{Object.entries(filteredStats).map(([deviceId, sensorStats]) => {
						const device = devicesMap.get(deviceId);
						if (!device) return null;

						return (
							<div
								key={deviceId}
								className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
							>
								{/* Header do dispositivo */}
								<div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex items-center gap-2">
									<Cpu className="w-4 h-4 text-emerald-600" />
									<span className="font-medium text-gray-900 dark:text-white">
										{device.name || device.macAddress}
									</span>
									<Badge variant="outline" className="ml-auto text-white">
										{Object.keys(sensorStats).length} sensor(es)
									</Badge>
								</div>

								{/* Estatísticas dos sensores */}
								<div className="divide-y divide-gray-200 dark:divide-gray-700">
									{Object.entries(sensorStats).map(([sensorId, stats]) => {
										const sensor = sensorsMap.get(sensorId);
										const sensorName = sensor?.name || "Sensor";
										const unit = sensor?.unit || "";

										return (
											<div
												key={sensorId}
												className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
											>
												<div className="flex items-center gap-2 mb-3">
													<ChevronRight className="w-4 h-4 text-gray-400" />
													<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
														{sensorName}
													</span>
													{unit && (
														<Badge variant="secondary" className="text-xs ml-1">
															{unit}
														</Badge>
													)}
												</div>

												<div className="grid grid-cols-3 gap-4 pl-6">
													{/* Mínimo */}
													<div className="flex items-center gap-2">
														<div className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
															<TrendingDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
														</div>
														<div>
															<p className="text-xs text-gray-500 dark:text-gray-400">
																Mínimo
															</p>
															<p className="text-sm font-semibold text-gray-900 dark:text-white">
																{stats.min.toFixed(2)}
																{unit && (
																	<span className="text-xs font-normal text-gray-500 ml-1">
																		{unit}
																	</span>
																)}
															</p>
														</div>
													</div>

													{/* Máximo */}
													<div className="flex items-center gap-2">
														<div className="p-1.5 rounded-full bg-red-100 dark:bg-red-900/30">
															<TrendingUp className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
														</div>
														<div>
															<p className="text-xs text-gray-500 dark:text-gray-400">
																Máximo
															</p>
															<p className="text-sm font-semibold text-gray-900 dark:text-white">
																{stats.max.toFixed(2)}
																{unit && (
																	<span className="text-xs font-normal text-gray-500 ml-1">
																		{unit}
																	</span>
																)}
															</p>
														</div>
													</div>

													{/* Média */}
													<div className="flex items-center gap-2">
														<div className="p-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30">
															<Activity className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
														</div>
														<div>
															<p className="text-xs text-gray-500 dark:text-gray-400">
																Média
															</p>
															<p className="text-sm font-semibold text-gray-900 dark:text-white">
																{stats.avg.toFixed(2)}
																{unit && (
																	<span className="text-xs font-normal text-gray-500 ml-1">
																		{unit}
																	</span>
																)}
															</p>
														</div>
													</div>

													<div className="flex items-center gap-2">
														<div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/30">
															<LineChart className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
														</div>
														<div>
															<p className="text-xs text-gray-500 dark:text-gray-400">
																Total
															</p>
															<p className="text-sm font-semibold text-gray-900 dark:text-white">
																{`${stats.total} registro(s)`}
															</p>
														</div>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}

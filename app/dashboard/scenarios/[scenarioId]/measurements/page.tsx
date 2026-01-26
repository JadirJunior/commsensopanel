"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	BarChart3,
	TrendingUp,
	Database,
	Clock,
	TableIcon,
	LineChart,
} from "lucide-react";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { DeviceScenario } from "@/types/device";
import {
	Measurement,
	FilterMeasurementsDTO,
	MeasurementsResponse,
} from "@/types/measurement";
import {
	MeasurementChart,
	MeasurementFilters,
	MeasurementTable,
} from "@/components/dashboard/measurements";
import { VerifyPermissions } from "@/components/rbac";
import { SCENARIO_PERMISSIONS } from "@/constants/permissions";

export default function MeasurementsPage() {
	const params = useParams();
	const { user } = useAuth();
	const scenarioId = params.scenarioId as string;

	const [measurements, setMeasurements] = useState<Measurement[]>([]);
	const [total, setTotal] = useState(0);
	const [devices, setDevices] = useState<DeviceScenario[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingDevices, setIsLoadingDevices] = useState(true);
	const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

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

	// Busca os dispositivos do cenário
	const fetchDevices = useCallback(async () => {
		if (!tenantId) return;

		try {
			setIsLoadingDevices(true);
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
			console.error("Erro ao buscar dispositivos:", error);
		} finally {
			setIsLoadingDevices(false);
		}
	}, [tenantId, scenarioId]);

	// Busca as medições com os filtros
	const fetchMeasurements = useCallback(
		async (filters: FilterMeasurementsDTO) => {
			if (!tenantId) return;

			try {
				setIsLoading(true);
				const response = await apiService.fetchWithAuth<MeasurementsResponse>(
					"/measurement",
					{
						method: "POST",
						headers: {
							"x-tenant-id": tenantId,
							"x-scenario-id": scenarioId,
						},
						body: JSON.stringify(filters),
					},
				);

				if (response.data) {
					setMeasurements(response.data.measurements);
					setTotal(response.data.total);
					setLastFetchTime(new Date());
				}
			} catch (error) {
				console.error("Erro ao buscar medições:", error);
				toast.error("Erro ao buscar medições");
			} finally {
				setIsLoading(false);
			}
		},
		[tenantId, scenarioId],
	);

	// Carrega dispositivos na montagem
	useEffect(() => {
		fetchDevices();
	}, [fetchDevices]);

	// Estatísticas das medições
	const stats = useMemo(() => {
		if (measurements.length === 0) {
			return {
				total: 0,
				min: 0,
				max: 0,
				avg: 0,
			};
		}

		const values = measurements.map((m) => Number(m.value));
		return {
			total: measurements.length,
			min: Math.min(...values),
			max: Math.max(...values),
			avg: values.reduce((a, b) => a + b, 0) / values.length,
		};
	}, [measurements]);

	return (
		<VerifyPermissions
			scope="scenario"
			tenantId={tenantId}
			scenarioId={scenarioId}
			permissions={SCENARIO_PERMISSIONS.MEASUREMENT_VIEW}
			fallback={
				<div className="flex items-center justify-center h-64">
					<p className="text-gray-500 dark:text-gray-400">
						Você não tem permissão para visualizar medições
					</p>
				</div>
			}
		>
			<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
				{/* Header */}
				<div>
					<h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
						<BarChart3 className="w-6 h-6 text-emerald-600" />
						Medições
					</h2>
					<p className="text-gray-600 dark:text-gray-400 mt-1">
						Visualize e analise os dados coletados pelos dispositivos
					</p>
				</div>

				{/* Filtros */}
				<MeasurementFilters
					onFilter={fetchMeasurements}
					devices={devices}
					isLoading={isLoading}
				/>

				{/* Cards de Estatísticas */}
				{measurements.length > 0 && (
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
									Total de Registros
								</CardTitle>
								<Database className="w-4 h-4 text-blue-500" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-gray-900 dark:text-white">
									{stats.total.toLocaleString()}
								</div>
								<p className="text-xs text-gray-500 dark:text-gray-400">
									de {total.toLocaleString()} disponíveis
								</p>
							</CardContent>
						</Card>

						<Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
									Valor Mínimo
								</CardTitle>
								<TrendingUp className="w-4 h-4 text-emerald-500 rotate-180" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-gray-900 dark:text-white">
									{stats.min.toFixed(2)}
								</div>
							</CardContent>
						</Card>

						<Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
									Valor Máximo
								</CardTitle>
								<TrendingUp className="w-4 h-4 text-red-500" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-gray-900 dark:text-white">
									{stats.max.toFixed(2)}
								</div>
							</CardContent>
						</Card>

						<Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
									Média
								</CardTitle>
								<BarChart3 className="w-4 h-4 text-amber-500" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-gray-900 dark:text-white">
									{stats.avg.toFixed(2)}
								</div>
							</CardContent>
						</Card>
					</div>
				)}

				{/* Gráfico e Tabela com Tabs */}
				<Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
									Visualização de Medições
								</CardTitle>
								<CardDescription>
									Visualize os dados em gráfico ou tabela
								</CardDescription>
							</div>
							{lastFetchTime && (
								<div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
									<Clock className="w-3 h-3" />
									Atualizado às {lastFetchTime.toLocaleTimeString()}
								</div>
							)}
						</div>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="chart" className="w-full">
							<TabsList className="mb-4">
								<TabsTrigger value="chart" className="flex items-center gap-2">
									<LineChart className="w-4 h-4" />
									Gráfico
								</TabsTrigger>
								<TabsTrigger value="table" className="flex items-center gap-2">
									<TableIcon className="w-4 h-4" />
									Tabela
								</TabsTrigger>
							</TabsList>
							<TabsContent value="chart">
								<MeasurementChart
									measurements={measurements}
									isLoading={isLoading}
									title=""
								/>
							</TabsContent>
							<TabsContent value="table">
								<MeasurementTable measurements={measurements} pageSize={15} />
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>

				{/* Informações adicionais */}
				{!isLoading && measurements.length === 0 && !lastFetchTime && (
					<Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
						<CardContent className="flex items-center gap-4 py-6">
							<div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/50">
								<BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
							</div>
							<div>
								<h4 className="font-medium text-blue-900 dark:text-blue-100">
									Comece a visualizar seus dados
								</h4>
								<p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
									Use os filtros acima para selecionar o período e dispositivos
									desejados, depois clique em &quot;Buscar&quot; para carregar
									as medições.
								</p>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</VerifyPermissions>
	);
}

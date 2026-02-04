"use client";

import { useRef, useEffect, useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { Measurement } from "@/types/measurement";

interface MeasurementChartProps {
	measurements: Measurement[];
	isLoading?: boolean;
	title?: string;
}

type XY = { x: number; y: number };

function median(nums: number[]) {
	if (nums.length === 0) return 0;
	const a = [...nums].sort((x, y) => x - y);
	const mid = Math.floor(a.length / 2);
	return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

/**
 * Insere nulls para quebrar a linha quando há gaps grandes e
 * gera plotBands para destacar os períodos sem dados no eixo X.
 */
function buildGappedSeries(
	sorted: XY[],
	opts?: { minThresholdMs?: number; factor?: number },
) {
	const minThresholdMs = opts?.minThresholdMs ?? 15 * 60 * 1000; // 15 min
	const factor = opts?.factor ?? 3;

	if (sorted.length <= 1) {
		return {
			data: sorted as Array<{ x: number; y: number | null }>,
			plotBands: [] as Highcharts.XAxisPlotBandsOptions[],
			gapThresholdMs: minThresholdMs,
		};
	}

	const deltas: number[] = [];
	for (let i = 1; i < sorted.length; i++) {
		deltas.push(sorted[i].x - sorted[i - 1].x);
	}

	const med = median(deltas);
	const gapThresholdMs = Math.max(minThresholdMs, factor * med);

	const data: Array<{ x: number; y: number | null }> = [];
	const plotBands: Highcharts.XAxisPlotBandsOptions[] = [];

	for (let i = 0; i < sorted.length; i++) {
		data.push({ x: sorted[i].x, y: sorted[i].y });

		if (i < sorted.length - 1) {
			const gap = sorted[i + 1].x - sorted[i].x;

			if (gap > gapThresholdMs) {
				// quebra a linha: inserir um ponto null logo após o ponto atual
				data.push({ x: sorted[i].x + 1, y: null });

				// marca visualmente o período sem telemetria
				plotBands.push({
					from: sorted[i].x,
					to: sorted[i + 1].x,
					color: "rgba(107,114,128,0.15)",
					label: {
						text: "Sem dados",
						style: { color: "#9ca3af", fontSize: "10px" },
						verticalAlign: "top",
						y: 10,
					},
					zIndex: 2,
				});
			}
		}
	}

	return { data, plotBands, gapThresholdMs };
}

export function MeasurementChart({
	measurements,
	isLoading = false,
	title = "Medições",
}: MeasurementChartProps) {
	const chartRef = useRef<HighchartsReact.RefObject>(null);

	const { seriesData, averageSeries, plotBands } = useMemo(() => {
		const grouped = measurements.reduce(
			(acc, m) => {
				const deviceName =
					m.DeviceScenario?.name ||
					m.DeviceScenario?.macAddress ||
					"Dispositivo";
				const sensorName = m.Sensor?.Category?.name || "Sensor";
				const unit = m.Sensor?.Category?.unit || "";

				// chave única por deviceScenario + sensor
				const key = `${m.deviceScenarioId}_${m.sensorId}`;

				if (!acc[key]) {
					acc[key] = {
						deviceName,
						sensorName,
						unit,
						data: [] as XY[],
					};
				}

				acc[key].data.push({
					x: new Date(m.dtMeasure).getTime(),
					y: Number(m.value),
				});

				return acc;
			},
			{} as Record<
				string,
				{
					deviceName: string;
					sensorName: string;
					unit: string;
					data: XY[];
				}
			>,
		);

		const colors = [
			"#10b981", // emerald
			"#3b82f6", // blue
			"#f59e0b", // amber
			"#ef4444", // red
			"#8b5cf6", // violet
			"#ec4899", // pink
			"#06b6d4", // cyan
			"#84cc16", // lime
			"#f97316", // orange
			"#6366f1", // indigo
		];

		const avgColors = [
			"#059669", // emerald mais escuro
			"#2563eb", // blue mais escuro
			"#d97706", // amber mais escuro
			"#dc2626", // red mais escuro
			"#7c3aed", // violet mais escuro
			"#db2777", // pink mais escuro
			"#0891b2", // cyan mais escuro
			"#65a30d", // lime mais escuro
			"#ea580c", // orange mais escuro
			"#4f46e5", // indigo mais escuro
		];

		const allPlotBands: Highcharts.XAxisPlotBandsOptions[] = [];

		const mainSeries = Object.entries(grouped).map(([_, group], index) => {
			const sorted = [...group.data].sort((a, b) => a.x - b.x);
			const { data: gappedData, plotBands: bands } = buildGappedSeries(sorted, {
				minThresholdMs: 15 * 60 * 1000,
				factor: 3,
			});

			allPlotBands.push(...bands);

			return {
				name: `${group.deviceName} - ${group.sensorName}${group.unit ? ` (${group.unit})` : ""}`,
				data: gappedData,
				type: "line" as const,
				color: colors[index % colors.length],
				marker: { enabled: true, radius: 3 },
				connectNulls: false,
				custom: {
					deviceName: group.deviceName,
					sensorName: group.sensorName,
					unit: group.unit,
					isAverage: false,
				},
			};
		});

		const avgSeries = Object.entries(grouped).map(([_, group], index) => {
			const sorted = [...group.data].sort((a, b) => a.x - b.x);

			const avgValue =
				sorted.reduce((sum, d) => sum + d.y, 0) / Math.max(1, sorted.length);

			// usa o mesmo padrão de gaps da série principal, mas com valor médio
			const { data: gappedData } = buildGappedSeries(sorted, {
				minThresholdMs: 15 * 60 * 1000,
				factor: 3,
			});

			const avgData = gappedData.map((p) => ({
				x: p.x,
				y: p.y === null ? null : avgValue,
			}));

			return {
				name: `Média - ${group.deviceName} - ${group.sensorName}`,
				data: avgData,
				type: "line" as const,
				color: avgColors[index % avgColors.length],
				dashStyle: "Dash" as Highcharts.DashStyleValue,
				lineWidth: 2,
				marker: { enabled: false },
				connectNulls: false,
				enableMouseTracking: true,
				custom: {
					deviceName: group.deviceName,
					sensorName: group.sensorName,
					unit: group.unit,
					isAverage: true,
					avgValue,
				},
			};
		});

		return {
			seriesData: mainSeries,
			averageSeries: avgSeries,
			plotBands: allPlotBands,
		};
	}, [measurements]);

	const options: Highcharts.Options = {
		chart: {
			type: "line",
			backgroundColor: "transparent",
			style: { fontFamily: "inherit" },
			zooming: { type: "x" },
		},
		title: {
			text: title,
			style: { color: "#9ca3af", fontSize: "16px" },
		},
		xAxis: {
			type: "datetime",
			title: { text: "Data/Hora", style: { color: "#9ca3af" } },
			labels: { style: { color: "#9ca3af" } },
			lineColor: "#374151",
			tickColor: "#374151",
			gridLineColor: "#374151",
			plotBands,
		},
		yAxis: {
			title: { text: "Valor", style: { color: "#9ca3af" } },
			labels: { style: { color: "#9ca3af" } },
			gridLineColor: "#374151",
		},
		legend: {
			enabled: true,
			itemStyle: { color: "#9ca3af" },
			itemHoverStyle: { color: "#10b981" },
		},
		tooltip: {
			shared: true,
			useHTML: true,
			backgroundColor: "#1f2937",
			borderColor: "#374151",
			style: { color: "#f3f4f6" },
			formatter: function () {
				const points = this.points || [];
				let html = `<b>${Highcharts.dateFormat("%d/%m/%Y %H:%M:%S", this.x as number)}</b><br/>`;

				points.forEach((point) => {
					const series = point.series as unknown as {
						options: {
							custom?: {
								deviceName: string;
								sensorName: string;
								unit: string;
								isAverage?: boolean;
								avgValue?: number;
							};
						};
					};

					const custom = series.options.custom;
					const unit = custom?.unit || "";
					const isAverage = custom?.isAverage || false;

					// Se for ponto "null" (gap), não poluir tooltip
					if (point.y === null || point.y === undefined) return;

					if (isAverage) {
						html += `<span style="color:${point.color}">---</span> `;
						html += `<i>Média ${custom?.deviceName || "Dispositivo"} - ${custom?.sensorName || "Sensor"}: </i>`;
						html += `<b>${Number(point.y).toFixed(2)}${unit ? ` ${unit}` : ""}</b>`;
					} else {
						html += `<span style="color:${point.color}">●</span> `;
						html += `<b>${custom?.deviceName || "Dispositivo"}</b> - ${custom?.sensorName || "Sensor"}: `;
						html += `<b>${point.y}${unit ? ` ${unit}` : ""}</b>`;
					}

					html += "<br/>";
				});

				return html;
			},
		},
		plotOptions: {
			line: {
				dataLabels: { enabled: false },
				enableMouseTracking: true,
			},
			series: {
				animation: { duration: 500 },
			},
		},
		credits: { enabled: false },
		series: [...seriesData, ...averageSeries],
		noData: {
			style: {
				fontWeight: "bold",
				fontSize: "14px",
				color: "#6b7280",
			},
		},
	};

	useEffect(() => {
		if (chartRef.current?.chart) {
			chartRef.current.chart.reflow();
		}
	}, [measurements]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-[400px] bg-gray-50 dark:bg-gray-800/50 rounded-lg">
				<div className="flex flex-col items-center gap-3">
					<div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
					<span className="text-sm text-gray-500 dark:text-gray-400">
						Carregando gráfico...
					</span>
				</div>
			</div>
		);
	}

	if (measurements.length === 0) {
		return (
			<div className="flex items-center justify-center h-[400px] bg-gray-50 dark:bg-gray-800/50 rounded-lg">
				<div className="text-center">
					<p className="text-gray-500 dark:text-gray-400">
						Nenhuma medição encontrada
					</p>
					<p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
						Ajuste os filtros para visualizar os dados
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full">
			<HighchartsReact
				highcharts={Highcharts}
				options={options}
				ref={chartRef}
				containerProps={{ style: { height: "400px", width: "100%" } }}
			/>
		</div>
	);
}

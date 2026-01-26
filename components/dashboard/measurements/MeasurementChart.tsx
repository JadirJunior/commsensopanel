"use client";

import { useRef, useEffect } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { Measurement } from "@/types/measurement";

interface MeasurementChartProps {
	measurements: Measurement[];
	isLoading?: boolean;
	title?: string;
}

export function MeasurementChart({
	measurements,
	isLoading = false,
	title = "Medições",
}: MeasurementChartProps) {
	const chartRef = useRef<HighchartsReact.RefObject>(null);

	// Agrupa medições por dispositivo + sensor/categoria para séries separadas
	const seriesData = (() => {
		const grouped = measurements.reduce(
			(acc, m) => {
				const deviceName =
					m.DeviceScenario?.name ||
					m.DeviceScenario?.macAddress ||
					"Dispositivo";
				const sensorName = m.Sensor?.Category?.name || "Sensor";
				const unit = m.Sensor?.Category?.unit || "";

				// Chave única: dispositivo + sensor
				const key = `${m.deviceScenarioId}_${m.sensorId}`;

				if (!acc[key]) {
					acc[key] = {
						deviceName,
						sensorName,
						unit,
						data: [],
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
					data: { x: number; y: number }[];
				}
			>,
		);

		// Gera cores distintas por combinação
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

		return Object.entries(grouped).map(([key, group], index) => ({
			name: `${group.deviceName} - ${group.sensorName}${group.unit ? ` (${group.unit})` : ""}`,
			data: group.data.sort((a, b) => a.x - b.x),
			type: "line" as const,
			color: colors[index % colors.length],
			marker: {
				enabled: true,
				radius: 3,
			},
			// Dados extras para tooltip
			custom: {
				deviceName: group.deviceName,
				sensorName: group.sensorName,
				unit: group.unit,
			},
		}));
	})();

	const options: Highcharts.Options = {
		chart: {
			type: "line",
			backgroundColor: "transparent",
			style: {
				fontFamily: "inherit",
			},
			zooming: {
				type: "x",
			},
		},
		title: {
			text: title,
			style: {
				color: "#9ca3af",
				fontSize: "16px",
			},
		},
		xAxis: {
			type: "datetime",
			title: {
				text: "Data/Hora",
				style: { color: "#9ca3af" },
			},
			labels: {
				style: { color: "#9ca3af" },
			},
			lineColor: "#374151",
			tickColor: "#374151",
			gridLineColor: "#374151",
		},
		yAxis: {
			title: {
				text: "Valor",
				style: { color: "#9ca3af" },
			},
			labels: {
				style: { color: "#9ca3af" },
			},
			gridLineColor: "#374151",
		},
		legend: {
			enabled: true,
			itemStyle: {
				color: "#9ca3af",
			},
			itemHoverStyle: {
				color: "#10b981",
			},
		},
		tooltip: {
			shared: true,
			useHTML: true,
			backgroundColor: "#1f2937",
			borderColor: "#374151",
			style: {
				color: "#f3f4f6",
			},
			formatter: function () {
				const points = this.points || [];
				let html = `<b>${Highcharts.dateFormat("%d/%m/%Y %H:%M:%S", this.x as number)}</b><br/>`;

				points.forEach((point) => {
					const series = point.series as unknown as {
						options: {
							custom?: { deviceName: string; sensorName: string; unit: string };
						};
					};
					const custom = series.options.custom;
					const unit = custom?.unit || "";

					html += `<span style="color:${point.color}">●</span> `;
					html += `<b>${custom?.deviceName || "Dispositivo"}</b> - ${custom?.sensorName || "Sensor"}: `;
					html += `<b>${point.y}${unit ? ` ${unit}` : ""}</b>`;
					html += "<br/>";
				});

				return html;
			},
		},
		plotOptions: {
			line: {
				dataLabels: {
					enabled: false,
				},
				enableMouseTracking: true,
			},
			series: {
				animation: {
					duration: 500,
				},
			},
		},
		credits: {
			enabled: false,
		},
		series: seriesData,
		noData: {
			style: {
				fontWeight: "bold",
				fontSize: "14px",
				color: "#6b7280",
			},
		},
	};

	// Atualiza o gráfico quando os dados mudam
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

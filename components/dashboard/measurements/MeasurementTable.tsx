"use client";

import { Measurement } from "@/types/measurement";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MeasurementTableProps {
	measurements: Measurement[];
	pageSize?: number;
}

export function MeasurementTable({
	measurements,
	pageSize = 10,
}: MeasurementTableProps) {
	const [currentPage, setCurrentPage] = useState(1);

	const totalPages = Math.ceil(measurements.length / pageSize);
	const startIndex = (currentPage - 1) * pageSize;
	const paginatedMeasurements = measurements.slice(
		startIndex,
		startIndex + pageSize,
	);

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString("pt-BR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	};

	if (measurements.length === 0) {
		return (
			<div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
				Nenhuma medição para exibir
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow className="bg-gray-50 dark:bg-gray-800/50">
							<TableHead className="font-semibold">Data/Hora</TableHead>
							<TableHead className="font-semibold">Sensor</TableHead>
							<TableHead className="font-semibold">Dispositivo</TableHead>
							<TableHead className="font-semibold text-right">Valor</TableHead>
							<TableHead className="font-semibold">Unidade</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginatedMeasurements.map((measurement) => (
							<TableRow
								key={measurement.id}
								className="hover:bg-gray-50 dark:hover:bg-gray-800/30"
							>
								<TableCell className="font-mono text-sm">
									{formatDate(measurement.dtMeasure)}
								</TableCell>
								<TableCell>
									<Badge variant="outline" className="font-normal">
										{measurement.Sensor?.Category?.name || "N/A"}
									</Badge>
								</TableCell>
								<TableCell className="text-gray-600 dark:text-gray-400">
									{measurement.DeviceScenario?.name ||
										measurement.DeviceScenario?.macAddress ||
										"N/A"}
								</TableCell>
								<TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
									{Number(measurement.value).toFixed(2)}
								</TableCell>
								<TableCell className="text-gray-500 dark:text-gray-400">
									{measurement.Sensor?.Category?.unit || "-"}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{/* Paginação */}
			{totalPages > 1 && (
				<div className="flex items-center justify-between">
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Mostrando {startIndex + 1} a{" "}
						{Math.min(startIndex + pageSize, measurements.length)} de{" "}
						{measurements.length} registros
					</p>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							disabled={currentPage === 1}
						>
							<ChevronLeft className="w-4 h-4" />
						</Button>
						<span className="text-sm text-gray-600 dark:text-gray-400">
							Página {currentPage} de {totalPages}
						</span>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							disabled={currentPage === totalPages}
						>
							<ChevronRight className="w-4 h-4" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

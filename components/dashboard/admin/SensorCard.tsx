"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gauge, Trash2 } from "lucide-react";

export type SensorCardVariant =
	| "view"
	| "existing"
	| "existing-category"
	| "new-category";

interface SensorCardProps {
	name: string;
	unit: string;
	id?: string;
	channel?: number;
	sensorKey?: string;
	variant?: SensorCardVariant;
	showStatus?: boolean;
	onRemove?: () => void;
}

const variantStyles = {
	view: {
		border: "border-emerald-300 dark:border-emerald-700",
		iconBg: "bg-emerald-500",
		badge: "bg-emerald-500 text-white border-0",
		statusColor: "text-emerald-600 dark:text-emerald-400",
		statusText: "Existente",
	},
	existing: {
		border: "border-emerald-300 dark:border-emerald-600",
		iconBg: "bg-emerald-500",
		badge: "bg-emerald-500 text-white border-0",
		statusColor: "text-emerald-600 dark:text-emerald-400",
		statusText: "Existente",
	},
	"existing-category": {
		border: "border-blue-300 dark:border-blue-600",
		iconBg: "bg-blue-500",
		badge: "bg-blue-500 text-white border-0",
		statusColor: "text-blue-600 dark:text-blue-400",
		statusText: "Categoria existente",
	},
	"new-category": {
		border: "border-amber-300 dark:border-amber-600",
		iconBg: "bg-amber-500",
		badge: "bg-amber-500 text-white border-0",
		statusColor: "text-amber-600 dark:text-amber-400",
		statusText: "Nova categoria",
	},
};

export function SensorCard({
	name,
	unit,
	id,
	channel,
	sensorKey,
	variant = "view",
	showStatus = false,
	onRemove,
}: SensorCardProps) {
	const styles = variantStyles[variant];
	const isEditable = variant !== "view";
	const borderWidth = isEditable ? "border-2" : "border";

	return (
		<div
			className={`flex items-center justify-between p-3 bg-white dark:bg-gray-800 ${borderWidth} ${styles.border} rounded-lg`}
		>
			<div className="flex items-center gap-3">
				<div
					className={`w-8 h-8 rounded-full flex items-center justify-center ${styles.iconBg}`}
				>
					<Gauge className="w-4 h-4 text-white" />
				</div>
				<div>
					<p className="text-sm font-semibold text-gray-900 dark:text-white">
						{name}
					</p>
					{showStatus ? (
						<div className="flex items-center gap-2 flex-wrap">
							<Badge className={`text-xs font-medium ${styles.badge}`}>
								{unit || "Sem unidade"}
							</Badge>
							{channel != null && (
								<Badge variant="outline" className="text-xs font-medium">
									Canal {channel}
								</Badge>
							)}
							{sensorKey && (
								<Badge
									variant="outline"
									className="text-xs font-mono text-gray-500 dark:text-gray-400"
								>
									{sensorKey}
								</Badge>
							)}
							<span className={`text-xs font-medium ${styles.statusColor}`}>
								• {styles.statusText}
							</span>
						</div>
					) : (
						<div className="flex items-center gap-2 flex-wrap">
							<p className="text-xs text-gray-500 dark:text-gray-400">
								{id ? `ID: ${id.slice(0, 8)}...` : unit || "Sem unidade"}
							</p>
							{channel != null && (
								<Badge variant="outline" className="text-xs">
									Canal {channel}
								</Badge>
							)}
							{sensorKey && (
								<Badge
									variant="outline"
									className="text-xs font-mono text-gray-500 dark:text-gray-400"
								>
									{sensorKey}
								</Badge>
							)}
						</div>
					)}
				</div>
			</div>
			<div className="flex items-center gap-2">
				{!showStatus && (
					<Badge className={`text-xs font-medium ${styles.badge}`}>
						{unit || "Sem unidade"}
					</Badge>
				)}
				{onRemove && (
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
						onClick={onRemove}
					>
						<Trash2 className="w-4 h-4" />
					</Button>
				)}
			</div>
		</div>
	);
}

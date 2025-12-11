"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import { Spot } from "@/types/spot";
import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { MapPin } from "lucide-react";

// Create a custom dynamic icon
const createCustomIcon = (color: string = "#059669") => {
	const iconHtml = renderToStaticMarkup(
		<div className="flex items-center justify-center w-8 h-8">
			<MapPin
				className="w-8 h-8 drop-shadow-md"
				style={{ color: color, fill: color }}
				stroke="white"
				strokeWidth={1.5}
			/>
		</div>
	);

	return L.divIcon({
		html: iconHtml,
		className: "bg-transparent border-none",
		iconSize: [32, 32],
		iconAnchor: [16, 32], // Tip of the pin
		popupAnchor: [0, -32], // Above the pin
	});
};

const defaultIcon = createCustomIcon();
const validIcon = createCustomIcon("#10b981"); // Emerald-500
const invalidIcon = createCustomIcon("#9ca3af"); // Gray-400

interface SpotsMapProps {
	spots: Spot[];
}

export default function SpotsMap({ spots }: SpotsMapProps) {
	// Filter spots with valid coordinates
	const validSpots = spots.filter(
		(spot) =>
			spot.latitude !== undefined &&
			spot.latitude !== null &&
			spot.longitude !== undefined &&
			spot.longitude !== null
	);

	// Default center (can be adjusted or calculated based on spots)
	const defaultCenter: [number, number] = [-23.55052, -46.633308]; // São Paulo
	const center =
		validSpots.length > 0
			? ([validSpots[0].latitude!, validSpots[0].longitude!] as [
					number,
					number
			  ])
			: defaultCenter;

	return (
		<div className="h-[600px] w-full rounded-md overflow-hidden border border-gray-200 dark:border-gray-800">
			<MapContainer
				center={center}
				zoom={13}
				style={{ height: "100%", width: "100%" }}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				{validSpots.map((spot) => (
					<Marker
						key={spot.id}
						position={[spot.latitude!, spot.longitude!]}
						icon={spot.valid ? validIcon : invalidIcon}
					>
						<Tooltip direction="top" offset={[0, -32]} opacity={1}>
							<span className="font-semibold">{spot.name}</span>
						</Tooltip>
						<Popup>
							<div className="p-2 min-w-[200px]">
								<div className="flex items-center gap-2 mb-2">
									<div
										className={`w-2 h-2 rounded-full ${
											spot.valid ? "bg-emerald-500" : "bg-gray-300"
										}`}
									/>
									<h3 className="font-bold text-sm m-0">{spot.name}</h3>
								</div>

								{spot.description && (
									<p className="text-xs text-gray-600 dark:text-gray-300 mb-2 leading-relaxed">
										{spot.description}
									</p>
								)}

								<div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs text-gray-500 dark:text-gray-400 space-y-1">
									<div className="flex justify-between">
										<span>Latitude:</span>
										<span className="font-mono">
											{Number(spot.latitude).toFixed(6)}
										</span>
									</div>
									<div className="flex justify-between">
										<span>Longitude:</span>
										<span className="font-mono">
											{Number(spot.longitude).toFixed(6)}
										</span>
									</div>
									{spot.weight && (
										<div className="flex justify-between">
											<span>Peso:</span>
											<span>{spot.weight}</span>
										</div>
									)}
								</div>
							</div>
						</Popup>
					</Marker>
				))}
			</MapContainer>
		</div>
	);
}

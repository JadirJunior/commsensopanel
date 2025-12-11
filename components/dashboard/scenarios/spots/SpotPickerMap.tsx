"use client";

import { useEffect, useState } from "react";
import {
	MapContainer,
	TileLayer,
	Marker,
	Popup,
	useMapEvents,
	useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Crosshair } from "lucide-react";
import { toast } from "sonner";

// Fix for default marker icon
const iconUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png";
const iconRetinaUrl =
	"https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png";
const shadowUrl =
	"https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png";

const customIcon = new L.Icon({
	iconUrl,
	iconRetinaUrl,
	shadowUrl,
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41],
});

interface SpotPickerMapProps {
	latitude?: number;
	longitude?: number;
	onLocationSelect: (lat: number, lng: number) => void;
}

function LocationMarker({
	position,
	onLocationSelect,
}: {
	position: [number, number] | null;
	onLocationSelect: (lat: number, lng: number) => void;
}) {
	const map = useMap();

	useMapEvents({
		click(e) {
			onLocationSelect(e.latlng.lat, e.latlng.lng);
		},
	});

	useEffect(() => {
		if (position) {
			map.flyTo(position, map.getZoom());
		}
	}, [position, map]);

	return position === null ? null : (
		<Marker position={position} icon={customIcon}>
			<Popup>Localização selecionada</Popup>
		</Marker>
	);
}

export default function SpotPickerMap({
	latitude,
	longitude,
	onLocationSelect,
}: SpotPickerMapProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const handleSearch = async () => {
		if (!searchQuery) return;

		setIsSearching(true);
		try {
			const response = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
					searchQuery
				)}`
			);
			const data = await response.json();

			if (data && data.length > 0) {
				const { lat, lon } = data[0];
				onLocationSelect(parseFloat(lat), parseFloat(lon));
				toast.success("Endereço encontrado!");
			} else {
				toast.error("Endereço não encontrado.");
			}
		} catch (error) {
			console.error("Erro ao buscar endereço:", error);
			toast.error("Erro ao buscar endereço.");
		} finally {
			setIsSearching(false);
		}
	};

	const handleLocateMe = () => {
		if ("geolocation" in navigator) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					onLocationSelect(position.coords.latitude, position.coords.longitude);
					toast.success("Localização atual obtida!");
				},
				(error) => {
					console.error("Erro de geolocalização:", error);
					toast.error("Não foi possível obter sua localização.");
				}
			);
		} else {
			toast.error("Geolocalização não suportada pelo seu navegador.");
		}
	};

	if (!mounted) return null;

	const position: [number, number] | null =
		latitude && longitude ? [latitude, longitude] : null;

	// Default center: São Paulo or current position
	const center: [number, number] = position || [-23.55052, -46.633308];

	return (
		<div className="space-y-2">
			<div className="flex gap-2">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
					<Input
						placeholder="Buscar endereço..."
						className="pl-10"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleSearch()}
					/>
				</div>
				<Button
					variant="outline"
					size="icon"
					onClick={handleSearch}
					disabled={isSearching}
					type="button"
				>
					<Search className="w-4 h-4" />
				</Button>
				<Button
					variant="outline"
					size="icon"
					onClick={handleLocateMe}
					type="button"
					title="Minha localização"
				>
					<Crosshair className="w-4 h-4" />
				</Button>
			</div>

			<div className="h-[300px] w-full rounded-md overflow-hidden border border-gray-200 dark:border-gray-800 relative z-0">
				<MapContainer
					center={center}
					zoom={13}
					style={{ height: "100%", width: "100%" }}
				>
					<TileLayer
						attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
					/>
					<LocationMarker
						position={position}
						onLocationSelect={onLocationSelect}
					/>
				</MapContainer>
			</div>
			<p className="text-xs text-gray-500">
				Clique no mapa para ajustar a localização exata.
			</p>
		</div>
	);
}

"use client";

import { useParams } from "next/navigation";
import { VerifyPermissions } from "@/components/rbac";
import { SCENARIO_PERMISSIONS } from "@/constants/permissions";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	MapPin,
	Plus,
	Search,
	List,
	Map as MapIcon,
	Edit,
	Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMemo, useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { Spot } from "@/types/spot";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { SpotDialog } from "@/components/dashboard/scenarios/spots/SpotDialog";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SpotsMap = dynamic(
	() => import("@/components/dashboard/scenarios/spots/SpotsMap"),
	{
		ssr: false,
		loading: () => <Skeleton className="h-[600px] w-full rounded-md" />,
	}
);

export default function SpotsPage() {
	const params = useParams();
	const { user } = useAuth();
	const scenarioId = params.scenarioId as string;
	const [searchTerm, setSearchTerm] = useState("");

	// Dialog states
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingSpot, setEditingSpot] = useState<Spot | null>(null);

	// Delete states
	const [spotToDelete, setSpotToDelete] = useState<Spot | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const tenantId = useMemo(() => {
		if (!user?.userTenants) return "";
		for (const ut of user.userTenants) {
			const us = ut.UserScenarios?.find(
				(scenario) => scenario.Scenario?.id === scenarioId
			);
			if (us) return ut.tenantId;
		}
		return "";
	}, [user, scenarioId]);

	const {
		data: spots,
		isLoading,
		execute: fetchSpots,
	} = useApi<Spot[]>("/spot");

	const refreshSpots = () => {
		if (scenarioId) {
			fetchSpots({
				headers: {
					"x-tenant-id": tenantId,
					"x-scenario-id": scenarioId,
				},
			});
		}
	};

	useEffect(() => {
		refreshSpots();
	}, [scenarioId, fetchSpots]);

	const handleCreate = () => {
		setEditingSpot(null);
		setIsDialogOpen(true);
	};

	const handleEdit = (spot: Spot) => {
		setEditingSpot(spot);
		setIsDialogOpen(true);
	};

	const handleDeleteClick = (spot: Spot) => {
		setSpotToDelete(spot);
	};

	const handleConfirmDelete = async () => {
		if (!spotToDelete) return;

		setIsDeleting(true);
		try {
			await apiService.fetchWithAuth(`/spot/${spotToDelete.id}`, {
				method: "DELETE",
				headers: {
					"x-scenario-id": scenarioId,
				},
			});
			toast.success("Spot excluído com sucesso!");
			refreshSpots();
		} catch (error) {
			console.error("Erro ao excluir spot:", error);
			toast.error("Erro ao excluir spot.");
		} finally {
			setIsDeleting(false);
			setSpotToDelete(null);
		}
	};

	const filteredSpots = useMemo(() => {
		if (!spots) return [];
		return spots.filter((spot) =>
			spot.name.toLowerCase().includes(searchTerm.toLowerCase())
		);
	}, [spots, searchTerm]);

	return (
		<VerifyPermissions
			scope="scenario"
			tenantId={tenantId}
			scenarioId={scenarioId}
			permissions={SCENARIO_PERMISSIONS.SPOT_VIEW}
			fallback={
				<div className="flex items-center justify-center h-64">
					<div className="text-center">
						<MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
						<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
							Acesso Negado
						</h3>
						<p className="text-gray-500 dark:text-gray-400 mt-1">
							Você não tem permissão para visualizar spots.
						</p>
					</div>
				</div>
			}
		>
			<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
							<MapPin className="w-6 h-6 text-emerald-600" />
							Spots
						</h2>
						<p className="text-gray-600 dark:text-gray-400 mt-1">
							Gerencie os pontos de medição do cenário
						</p>
					</div>
					<VerifyPermissions
						scope="scenario"
						tenantId={tenantId}
						scenarioId={scenarioId}
						permissions={SCENARIO_PERMISSIONS.SPOT_EDIT}
					>
						<Button className="gap-2" onClick={handleCreate}>
							<Plus className="w-4 h-4" />
							Novo Spot
						</Button>
					</VerifyPermissions>
				</div>

				<Tabs defaultValue="list" className="w-full">
					<div className="flex items-center justify-between mb-4">
						<TabsList>
							<TabsTrigger value="list" className="gap-2">
								<List className="w-4 h-4" />
								Lista
							</TabsTrigger>
							<TabsTrigger value="map" className="gap-2">
								<MapIcon className="w-4 h-4" />
								Mapa
							</TabsTrigger>
						</TabsList>

						{/* Search */}
						<div className="relative w-64">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
							<Input
								placeholder="Buscar spots..."
								className="pl-10"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>
					</div>

					<TabsContent value="list" className="mt-0">
						{isLoading ? (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{[1, 2, 3].map((i) => (
									<Skeleton key={i} className="h-32 w-full" />
								))}
							</div>
						) : filteredSpots.length === 0 ? (
							<Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 border-dashed">
								<CardContent className="flex flex-col items-center justify-center py-12">
									<MapPin className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
									<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
										Nenhum spot encontrado
									</h3>
									<p className="text-gray-500 dark:text-gray-400 mt-1 text-center max-w-md">
										{searchTerm
											? "Tente buscar com outro termo."
											: "Spots são pontos de medição onde os dispositivos coletam dados."}
									</p>
									{!searchTerm && (
										<VerifyPermissions
											scope="scenario"
											tenantId={tenantId}
											scenarioId={scenarioId}
											permissions={SCENARIO_PERMISSIONS.SPOT_EDIT}
										>
											<Button className="mt-4 gap-2" onClick={handleCreate}>
												<Plus className="w-4 h-4" />
												Criar Spot
											</Button>
										</VerifyPermissions>
									)}
								</CardContent>
							</Card>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{filteredSpots.map((spot) => (
									<Card
										key={spot.id}
										className="hover:shadow-md transition-shadow group relative"
									>
										<CardContent className="p-6">
											<div className="flex items-start justify-between">
												<div>
													<h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
														{spot.name}
													</h3>
													{spot.description && (
														<p className="text-sm text-gray-500 mt-1 line-clamp-2">
															{spot.description}
														</p>
													)}
												</div>
												<div
													className={`w-2 h-2 rounded-full ${
														spot.valid ? "bg-emerald-500" : "bg-gray-300"
													}`}
												/>
											</div>
											<div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
												<MapPin className="w-3 h-3" />
												{spot.latitude && spot.longitude ? (
													<span>
														{Number(spot.latitude).toFixed(4)},{" "}
														{Number(spot.longitude).toFixed(4)}
													</span>
												) : (
													<span>Sem localização</span>
												)}
											</div>

											{/* Actions */}
											<div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
												<VerifyPermissions
													scope="scenario"
													tenantId={tenantId}
													scenarioId={scenarioId}
													permissions={SCENARIO_PERMISSIONS.SPOT_EDIT}
												>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8"
														onClick={() => handleEdit(spot)}
													>
														<Edit className="w-4 h-4" />
													</Button>
												</VerifyPermissions>
												<VerifyPermissions
													scope="scenario"
													tenantId={tenantId}
													scenarioId={scenarioId}
													permissions={SCENARIO_PERMISSIONS.SPOT_ALL}
												>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-red-500 hover:text-red-600"
														onClick={() => handleDeleteClick(spot)}
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												</VerifyPermissions>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						)}
					</TabsContent>

					<TabsContent value="map" className="mt-0">
						<SpotsMap spots={filteredSpots} />
					</TabsContent>
				</Tabs>

				<SpotDialog
					open={isDialogOpen}
					onOpenChange={setIsDialogOpen}
					scenarioId={scenarioId}
					tenantId={tenantId}
					editingSpot={editingSpot}
					onSaved={refreshSpots}
				/>

				<AlertDialog
					open={!!spotToDelete}
					onOpenChange={(open) => !open && setSpotToDelete(null)}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Excluir Spot</AlertDialogTitle>
							<AlertDialogDescription>
								Tem certeza que deseja excluir o spot &quot;{spotToDelete?.name}
								&quot;? Esta ação não pode ser desfeita.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancelar</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleConfirmDelete}
								className="bg-red-600 hover:bg-red-700"
							>
								{isDeleting ? "Excluindo..." : "Excluir"}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</VerifyPermissions>
	);
}

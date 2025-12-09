"use client";

import { useParams } from "next/navigation";
import { VerifyPermissions } from "@/components/rbac";
import { SCENARIO_PERMISSIONS } from "@/constants/permissions";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, Search, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMemo } from "react";

export default function ScenarioUsersPage() {
	const params = useParams();
	const { user } = useAuth();
	const scenarioId = params.scenarioId as string;

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

	return (
		<VerifyPermissions
			scope="scenario"
			tenantId={tenantId}
			scenarioId={scenarioId}
			permissions={SCENARIO_PERMISSIONS.USER_VIEW}
			fallback={
				<div className="flex items-center justify-center h-64">
					<div className="text-center">
						<Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
						<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
							Acesso Negado
						</h3>
						<p className="text-gray-500 dark:text-gray-400 mt-1">
							Você não tem permissão para gerenciar usuários do cenário.
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
							<Users className="w-6 h-6 text-indigo-600" />
							Usuários do Cenário
						</h2>
						<p className="text-gray-600 dark:text-gray-400 mt-1">
							Gerencie os usuários que têm acesso a este cenário
						</p>
					</div>
					<VerifyPermissions
						scope="scenario"
						tenantId={tenantId}
						scenarioId={scenarioId}
						permissions={SCENARIO_PERMISSIONS.USER_EDIT}
					>
						<Button className="gap-2">
							<UserPlus className="w-4 h-4" />
							Adicionar Usuário
						</Button>
					</VerifyPermissions>
				</div>

				{/* Search */}
				<div className="flex gap-4">
					<div className="relative flex-1 max-w-md">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<Input placeholder="Buscar usuários..." className="pl-10" />
					</div>
				</div>

				{/* Empty State */}
				<Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
						<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
							Nenhum usuário no cenário
						</h3>
						<p className="text-gray-500 dark:text-gray-400 mt-1 text-center max-w-md">
							Adicione usuários da instituição para colaborar neste cenário.
						</p>
						<VerifyPermissions
							scope="scenario"
							tenantId={tenantId}
							scenarioId={scenarioId}
							permissions={SCENARIO_PERMISSIONS.USER_EDIT}
						>
							<Button className="mt-4 gap-2">
								<UserPlus className="w-4 h-4" />
								Adicionar Primeiro Usuário
							</Button>
						</VerifyPermissions>
					</CardContent>
				</Card>
			</div>
		</VerifyPermissions>
	);
}

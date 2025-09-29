"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "../providers/auth-provider";

export default function DashboardPage() {
	const { user } = useAuth();

	return (
		<div className="flex h-screen">
			<main className="flex-1 p-6 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
				<header className="mb-6 flex items-center justify-between">
					<div>
						<h2 className="text-2xl font-bold">
							Bem-vindo, {user?.username || "usuário"}
						</h2>
						<p className="text-sm text-muted-foreground">
							Aqui está um resumo dos seus dados.
						</p>
					</div>
				</header>

				<section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					<Card>
						<CardHeader>
							<CardTitle>Containeres Cadastrados</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold">12</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Dispositivos conectados</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold">5</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Alertas recentes</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold">3</p>
						</CardContent>
					</Card>
				</section>
			</main>
		</div>
	);
}

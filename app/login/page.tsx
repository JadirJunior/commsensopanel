"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { LoadingScreen } from "@/components/ui/loading-screen";
import Image from "next/image";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [showLoading, setShowLoading] = useState(false);
	const { login, isLoading } = useAuth();
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		try {
			await login({ email, password });
			// Mostrar tela de loading após login bem-sucedido
			setShowLoading(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro ao fazer login");
		}
	};

	const handleLoadingComplete = () => {
		router.push("/dashboard");
	};

	return (
		<>
			<LoadingScreen
				isLoading={showLoading}
				onComplete={handleLoadingComplete}
				minDuration={5000}
			/>
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
				<Card className="w-full max-w-md shadow-xl">
					<CardHeader className="space-y-4 text-center">
						<div className="mx-auto w-20 h-20 flex items-center justify-center">
							<Image
								src="/commsenso-iot-logo.png"
								alt="CommSenso"
								width={80}
								height={80}
								className="object-contain"
							/>
						</div>
						<div>
							<CardTitle className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
								CommSenso
							</CardTitle>
							<CardDescription className="mt-2">
								Sistema de Gestão Sustentável
							</CardDescription>
						</div>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									placeholder="seu@email.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									disabled={isLoading}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="password">Senha</Label>
								<Input
									id="password"
									type="password"
									placeholder="••••••••"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									disabled={isLoading}
								/>
							</div>
							{error && (
								<div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
									{error}
								</div>
							)}
							<Button
								type="submit"
								className="w-full"
								disabled={isLoading || showLoading}
							>
								{isLoading ? "Entrando..." : "Entrar"}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</>
	);
}

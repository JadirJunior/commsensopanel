"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "../providers/auth-provider";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { EyeClosedIcon, EyeIcon } from "lucide-react";
import { toast } from "sonner";
import { AuthAPI } from "@/utils/api";

export default function LoginPage() {
	const { login } = useAuth();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const router = useRouter();
	const [passwordVisible, setPasswordVisible] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		try {
			const { data, message } = await AuthAPI.login(username, password);
			const { accessToken, user } = data;
			toast.success(message || "Login realizado com sucesso");
			login(accessToken, user);
			router.push("/dashboard");
		} catch (error: unknown) {
			if (error instanceof Error) {
				toast.error(error.message || "Erro ao fazer login");
			} else {
				toast.error("Erro ao fazer login");
			}
		}
	}

	return (
		<div className="flex justify-center items-center min-h-screen">
			<Card className="w-[400px]">
				<CardHeader></CardHeader>
				<CardContent>
					<div className="flex justify-center mb-4">
						<Image
							src="/logo.png"
							alt="CoMMSenso Logo"
							width={0}
							height={0}
							sizes="100vw"
							className="w-auto"
						/>
					</div>

					<form onSubmit={handleSubmit} className="flex flex-col gap-4">
						<Input
							type="text"
							placeholder="Usuário"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
						/>
						<div className="relative">
							<Input
								type={passwordVisible ? "text" : "password"}
								placeholder="Senha"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="pr-10" // espaço extra pro ícone não ficar por cima do texto
							/>
							<button
								type="button"
								onClick={() => setPasswordVisible(!passwordVisible)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
							>
								{passwordVisible ? (
									<EyeIcon className="h-4 w-4 cursor-pointer" />
								) : (
									<EyeClosedIcon className="h-4 w-4 cursor-pointer" />
								)}
							</button>
						</div>
						<Button type="submit" className="cursor-pointer">
							Entrar
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

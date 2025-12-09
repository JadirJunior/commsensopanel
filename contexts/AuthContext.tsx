"use client";

import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { User, LoginCredentials, AuthContextType } from "@/types/auth";
import { apiService } from "@/lib/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [accessToken, setAccessToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();

	// Inicializar autenticação do cookie
	useEffect(() => {
		const initAuth = async () => {
			console.log("[AuthContext] Iniciando verificação de autenticação...");

			try {
				const savedAccessToken = Cookies.get(ACCESS_TOKEN_KEY);
				console.log("[AuthContext] Token encontrado:", !!savedAccessToken);

				if (savedAccessToken) {
					// Tenta validar o token com o backend
					try {
						console.log("[AuthContext] Chamando getCurrentUser...");
						const currentUser = await apiService.getCurrentUser(
							savedAccessToken
						);
						console.log("[AuthContext] Usuário validado:", currentUser);
						setUser(currentUser);
						setAccessToken(savedAccessToken);
						Cookies.set(USER_KEY, JSON.stringify(currentUser), { expires: 7 });
					} catch (error) {
						// Token inválido, limpar todos os cookies
						console.log(
							"[AuthContext] Token inválido, limpando cookies:",
							error
						);
						await fetch("/api/auth/logout", { method: "POST" });

						Cookies.remove(ACCESS_TOKEN_KEY, { path: "/" });
						Cookies.remove(REFRESH_TOKEN_KEY, { path: "/" });
						Cookies.remove(USER_KEY, { path: "/" });
						setAccessToken(null);
						setUser(null);
					}
				} else {
					// Se não tem token no cliente, garante que não tem no servidor também
					// Isso evita loops de redirecionamento se houver cookies httpOnly antigos
					console.log(
						"[AuthContext] Sem token, garantindo limpeza do servidor"
					);
					await fetch("/api/auth/logout", { method: "POST" });

					Cookies.remove(USER_KEY, { path: "/" });
					setAccessToken(null);
					setUser(null);
				}
			} catch (error) {
				// Em caso de erro, limpa tudo por segurança
				console.log("[AuthContext] Erro geral:", error);
				await fetch("/api/auth/logout", { method: "POST" });

				Cookies.remove(ACCESS_TOKEN_KEY, { path: "/" });
				Cookies.remove(REFRESH_TOKEN_KEY, { path: "/" });
				Cookies.remove(USER_KEY, { path: "/" });
				setAccessToken(null);
				setUser(null);
			} finally {
				console.log("[AuthContext] Finalizando, setando isLoading = false");
				setIsLoading(false);
			}
		};

		initAuth();
	}, []);

	const login = useCallback(
		async (credentials: LoginCredentials) => {
			try {
				setIsLoading(true);
				const response = await apiService.login(credentials);

				setUser(response.user);
				setAccessToken(response.accessToken);

				// Salvar no cookie (expira em 7 dias)
				Cookies.set(ACCESS_TOKEN_KEY, response.accessToken, { expires: 7 });
				Cookies.set(REFRESH_TOKEN_KEY, response.refreshToken, { expires: 7 });
				Cookies.set(USER_KEY, JSON.stringify(response.user), { expires: 7 });

				// O redirecionamento é feito pelo componente de login após a tela de loading
			} catch (error) {
				// Propaga o erro para o componente de login mostrar a mensagem
				throw error;
			} finally {
				setIsLoading(false);
			}
		},
		[router]
	);

	const logout = useCallback(async () => {
		setUser(null);
		setAccessToken(null);

		// Limpar cookies via API (server-side)
		try {
			await fetch("/api/auth/logout", { method: "POST" });
		} catch {
			// Ignora erro - continua limpando client-side
		}

		// Limpar cookies client-side também
		Cookies.remove(ACCESS_TOKEN_KEY, { path: "/" });
		Cookies.remove(REFRESH_TOKEN_KEY, { path: "/" });
		Cookies.remove(USER_KEY, { path: "/" });

		router.push("/login");
	}, [router]);

	const value: AuthContextType = {
		user,
		accessToken,
		login,
		logout,
		isAuthenticated: !!user && !!accessToken,
		isLoading,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth deve ser usado dentro de um AuthProvider");
	}
	return context;
}

"use client";

import { AuthAPI } from "@/utils/api";
import { createContext, useContext, useEffect, useState } from "react";

type User = { id: string; username: string; role: string };

type AuthContextType = {
	user: User | null;
	token: string | null;
	login: (token: string, user: User) => void;
	logout: () => void;
	loading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	// Verifica se já existe um token salvo no localStorage ao carregar o componente
	useEffect(() => {
		const savedToken = localStorage.getItem("token");
		if (!savedToken) {
			setLoading(false);
			return;
		}

		// Se existir, valida o token (aqui você pode fazer uma chamada à API para validar)
		async function validate() {
			try {
				const res = await AuthAPI.fetchMe(savedToken ?? "");
				const data = res.data;
				login(savedToken!, data);
			} catch (error) {
				logout();
			} finally {
				setLoading(false);
			}
		}

		validate();
	}, []);

	function logout() {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		setUser(null);
		setToken(null);
	}

	function login(token: string, user: User) {
		setUser(user);
		setToken(token);
		localStorage.setItem("token", token);
		localStorage.setItem("user", JSON.stringify(user));
	}

	return (
		<AuthContext.Provider value={{ user, token, logout, login, loading }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth precisa ser usado dentro de AuthProvider");
	return ctx;
}

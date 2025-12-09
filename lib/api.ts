import Cookies from "js-cookie";
import { LoginCredentials, AuthResponse } from "@/types/auth";
import { ApiResponse, LoginResponseData, UserResponseData } from "@/types/api";

// Usa API routes do Next.js como proxy para evitar CORS
const API_URL = "";

class ApiService {
	private getHeaders(token?: string): HeadersInit {
		const headers: HeadersInit = {
			"Content-Type": "application/json",
		};

		if (token) {
			headers["Authorization"] = `Bearer ${token}`;
		}

		return headers;
	}

	/**
	 * Processa a resposta padrão do backend CommSensoRest
	 * O backend sempre retorna 200 OK, e o status real está dentro do objeto JSON
	 * Ignora o status HTTP e sempre processa o JSON
	 */
	private async processResponse<T>(
		response: Response
	): Promise<ApiResponse<T>> {
		// Sempre tenta parsear o JSON, ignorando o status HTTP
		const result: ApiResponse<T> = await response.json();

		// Verifica se a requisição foi bem sucedida baseado APENAS no campo success ou status do JSON
		const isSuccess =
			result.success === true ||
			(result.status !== undefined &&
				result.status >= 200 &&
				result.status < 300);

		if (!isSuccess) {
			throw new Error(result.message || "Erro na requisição");
		}

		return result;
	}

	async login(credentials: LoginCredentials): Promise<AuthResponse> {
		// Usa a API route do Next.js como proxy
		const response = await fetch(`/api/auth/login`, {
			method: "POST",
			headers: this.getHeaders(),
			body: JSON.stringify(credentials),
		});

		const result = await this.processResponse<LoginResponseData>(response);

		// Extrai os dados do objeto data
		if (!result.data) {
			throw new Error(result.message || "Dados de login não retornados");
		}

		const {
			id,
			username,
			email,
			accessToken,
			refreshToken,
			userTenants,
			systemAdmin,
		} = result.data;

		return {
			user: {
				id,
				email,
				username,
				name: username,
				systemAdmin,
				userTenants,
			},
			accessToken,
			refreshToken,
		};
	}

	async getCurrentUser(accessToken: string): Promise<AuthResponse["user"]> {
		console.log(
			"[ApiService] Chamando /api/auth/me com token:",
			accessToken?.substring(0, 20) + "..."
		);

		// Usa a API route do Next.js como proxy
		const response = await fetch(`/api/auth/me`, {
			method: "GET",
			headers: this.getHeaders(accessToken),
		});

		console.log("[ApiService] Resposta recebida:", response.status);

		const result = await this.processResponse<UserResponseData>(response);

		console.log("[ApiService] Resultado processado:", result);

		if (!result.data) {
			throw new Error(result.message || "Dados do usuário não retornados");
		}

		return {
			...result.data,
			name: result.data.name || result.data.username,
		};
	}

	/**
	 * Método genérico para fazer requisições autenticadas
	 * Retorna o ApiResponse completo para que o chamador possa acessar todos os campos
	 */
	async fetchWithAuth<T = unknown>(
		url: string,
		options: RequestInit = {}
	): Promise<ApiResponse<T>> {
		const token = Cookies.get("access_token");

		const headers = {
			...this.getHeaders(token),
			...options.headers,
		};

		// Usa a API route do Next.js como proxy
		const response = await fetch(`/api${url}`, {
			...options,
			headers,
		});

		const result = await this.processResponse<T>(response);

		// Verifica se o status indica sessão expirada (401)
		if (result.status === 401) {
			Cookies.remove("auth_token");
			window.location.href = "/login";
			throw new Error("Sessão expirada");
		}

		return result;
	}
}

export const apiService = new ApiService();

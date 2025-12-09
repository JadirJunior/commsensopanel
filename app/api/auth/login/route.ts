import { NextRequest, NextResponse } from "next/server";

// Helper para criar resposta no padrão do backend (sempre HTTP 200)
function createApiResponse<T>(
	data: T | null,
	success: boolean,
	status: number,
	message?: string
) {
	// Sempre retorna HTTP 200, o status real está no objeto
	return NextResponse.json(
		{
			success,
			status,
			message,
			data,
		},
		{ status: 200 }
	);
}

// Proxy para o backend CommSensoRest
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, password } = body;

		// Validação básica
		if (!email || !password) {
			return createApiResponse(
				null,
				false,
				400,
				"Email e senha são obrigatórios"
			);
		}

		const API_URL = process.env.API_URL || "http://localhost:3001";

		// O backend NestJS usa 'pass' ao invés de 'password'
		const response = await fetch(`${API_URL}/auth`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email, pass: password }),
		});

		// Sempre tenta pegar o JSON da resposta
		const result = await response.json();

		// Se login foi bem sucedido, seta os cookies no servidor também
		if (result.accessToken || result.data?.accessToken) {
			const accessToken = result.accessToken || result.data?.accessToken;
			const refreshToken = result.refreshToken || result.data?.refreshToken;

			const jsonResponse = NextResponse.json(result, { status: 200 });

			// Seta cookies acessíveis pelo cliente (httpOnly: false)
			jsonResponse.cookies.set("access_token", accessToken, {
				path: "/",
				maxAge: 60 * 60 * 24 * 7, // 7 dias
				httpOnly: false, // Permite acesso pelo JavaScript
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
			});

			if (refreshToken) {
				jsonResponse.cookies.set("refresh_token", refreshToken, {
					path: "/",
					maxAge: 60 * 60 * 24 * 7, // 7 dias
					httpOnly: false,
					secure: process.env.NODE_ENV === "production",
					sameSite: "lax",
				});
			}

			return jsonResponse;
		}

		// Repassa diretamente o objeto do backend
		return NextResponse.json(result, { status: 200 });
	} catch {
		// Só cai aqui se a requisição HTTP falhar completamente (backend offline, etc)
		return createApiResponse(
			null,
			false,
			500,
			"Erro ao conectar com o servidor"
		);
	}
}

import { NextRequest, NextResponse } from "next/server";

// Helper para criar resposta no padrão do backend (sempre HTTP 200)
function createApiResponse<T>(
	data: T | null,
	success: boolean,
	status: number,
	message?: string
) {
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
export async function GET(request: NextRequest) {
	try {
		const authHeader = request.headers.get("authorization");

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return createApiResponse(null, false, 401, "Token não fornecido");
		}

		console.log("Auth Header recebido:", authHeader);

		const token = authHeader.substring(7);
		const API_URL = process.env.API_URL || "http://localhost:3001";

		const response = await fetch(`${API_URL}/auth/me`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		// Sempre tenta pegar o JSON da resposta
		const result = await response.json();

		// Repassa diretamente o objeto do backend
		return NextResponse.json(result, { status: 200 });
	} catch {
		// Só cai aqui se a requisição HTTP falhar completamente
		return createApiResponse(
			null,
			false,
			500,
			"Erro ao conectar com o servidor"
		);
	}
}

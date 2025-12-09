import { NextResponse } from "next/server";

export async function POST() {
	const response = NextResponse.json(
		{ success: true, message: "Logout realizado com sucesso" },
		{ status: 200 }
	);

	// Remove todos os cookies de autenticação
	response.cookies.set("access_token", "", {
		path: "/",
		maxAge: 0,
		httpOnly: false,
	});

	response.cookies.set("refresh_token", "", {
		path: "/",
		maxAge: 0,
		httpOnly: false,
	});

	response.cookies.set("auth_user", "", {
		path: "/",
		maxAge: 0,
		httpOnly: false,
	});

	return response;
}

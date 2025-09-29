import { authHeader } from "./authHeader";

export async function login(username: string, password: string) {
	const res = await fetch(
		`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/login`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
		}
	);

	if (!res.ok) {
		const errorData = await res.json();
		throw new Error(errorData.message || "Erro no login");
	}

	const data = await res.json();

	if (data.status !== 200) {
		throw new Error(data.message || "Erro no login");
	}

	return data;
}

export async function fetchMe(token: string) {
	const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, {
		headers: authHeader(token),
	});
	if (!res.ok) {
		throw new Error("Falha ao buscar dados do usuário");
	}
	const data = await res.json();

	if (data.status !== 200) {
		throw new Error(data.message || "Falha ao buscar dados do usuário");
	}

	return data;
}

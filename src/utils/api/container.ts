import { authHeader } from "./authHeader";

export async function fetchContainers(token: string) {
	const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/containers`, {
		headers: authHeader(token),
	});

	if (!res.ok) {
		throw new Error("Failed to fetch containers");
	}

	const data = await res.json();

	if (data.status !== 200) {
		throw new Error(data.message || "Failed to fetch containers");
	}

	return data;
}

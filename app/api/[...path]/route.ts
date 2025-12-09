import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:3001";

async function proxyRequest(
	request: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> }
) {
	const { path } = await params;
	const pathString = path.join("/");
	const url = `${API_URL}/${pathString}`;
	const searchParams = request.nextUrl.searchParams.toString();
	const finalUrl = searchParams ? `${url}?${searchParams}` : url;

	try {
		const headers = new Headers(request.headers);
		// Remove host header to avoid issues
		headers.delete("host");
		headers.delete("connection");
		headers.delete("content-length");

		const body =
			request.method !== "GET" && request.method !== "HEAD"
				? await request.text()
				: undefined;

		const response = await fetch(finalUrl, {
			method: request.method,
			headers: headers,
			body: body,
		});

		const data = await response.json();

		return NextResponse.json(data, {
			status: response.status,
			headers: {
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		console.error("[Proxy] Error:", error);
		return NextResponse.json(
			{
				success: false,
				status: 500,
				message: "Erro interno no servidor proxy",
				data: null,
			},
			{ status: 500 }
		);
	}
}

export async function GET(request: NextRequest, context: any) {
	return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: any) {
	return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: any) {
	return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: any) {
	return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: any) {
	return proxyRequest(request, context);
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rotas protegidas que precisam de autenticação
const protectedRoutes = ["/dashboard"];

export function middleware(request: NextRequest) {
	const token = request.cookies.get("access_token")?.value;
	const pathname = request.nextUrl.pathname;

	// Debug: log para verificar se o middleware está sendo executado
	console.log(`[Middleware] Path: ${pathname}, Token exists: ${!!token}`);

	// Permitir rotas de API sem verificação de token no middleware
	if (pathname.startsWith("/api")) {
		return NextResponse.next();
	}

	// Ignorar arquivos estáticos
	if (pathname.startsWith("/_next") || pathname.includes(".")) {
		return NextResponse.next();
	}

	// Se está na página raiz, redireciona baseado na autenticação
	if (pathname === "/") {
		const redirectUrl = token ? "/dashboard" : "/login";
		console.log(`[Middleware] Redirecting from / to ${redirectUrl}`);
		return NextResponse.redirect(new URL(redirectUrl, request.url));
	}

	// Se está em rota protegida sem token, redireciona para login
	const isProtectedRoute = protectedRoutes.some((route) =>
		pathname.startsWith(route)
	);

	if (isProtectedRoute && !token) {
		console.log(`[Middleware] No token, redirecting to /login`);
		return NextResponse.redirect(new URL("/login", request.url));
	}

	// Se está na página de login com token, redireciona para dashboard
	if (pathname === "/login" && token) {
		console.log(`[Middleware] Has token, redirecting to /dashboard`);
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!_next/static|_next/image|favicon.ico).*)",
	],
};

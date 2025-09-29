"use client";

import { useAuth } from "@/app/providers/auth-provider";
import { usePathname } from "next/navigation";
import { SidebarInset, SidebarProvider } from "../ui/sidebar";
import { MenuLateral } from "./menu-lateral";

export function AppShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const { user } = useAuth();

	// páginas sem sidebar
	const noSidebarRoutes = ["/login", "/register"];

	const shouldShowSidebar = user && !noSidebarRoutes.includes(pathname);

	if (!shouldShowSidebar) {
		return <>{children}</>; // renderiza só o conteúdo
	}

	return (
		<SidebarProvider defaultOpen={false}>
			<MenuLateral />
			<SidebarInset>{children}</SidebarInset>
		</SidebarProvider>
	);
}

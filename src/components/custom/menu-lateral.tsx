"use client";

import * as React from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { Activity, Box, Cpu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerifyPermissions } from "./protected-layout";
import { useAuth } from "@/app/providers/auth-provider";

export function MenuLateral() {
	const { state, setOpen, setOpenMobile, isMobile, toggleSidebar } =
		useSidebar();
	const { logout } = useAuth();
	const sidebarRef = React.useRef<HTMLDivElement>(null);

	// Fecha ao clicar fora (apenas desktop, quando expandido)
	React.useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (
				!isMobile &&
				state === "expanded" &&
				sidebarRef.current &&
				!sidebarRef.current.contains(e.target as Node)
			) {
				toggleSidebar();
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isMobile, state, toggleSidebar]);

	return (
		<Sidebar
			ref={sidebarRef}
			onClick={() => {
				if (!isMobile && state === "collapsed") {
					toggleSidebar();
				}
			}}
			collapsible="icon"
		>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Menu</SidebarGroupLabel>
					<SidebarMenu>
						{[
							{
								href: "/dashboard/profile",
								label: "Perfil",
								icon: User,
								role: "user",
							},
							{
								href: "/dashboard/containers",
								label: "Containeres",
								icon: Box,
								role: "user",
							},
							{
								href: "/dashboard/sensors",
								label: "Sensores",
								icon: Activity,
								role: "admin",
							},
							{
								href: "/dashboard/devices",
								label: "Dispositivos",
								icon: Cpu,
								role: "user",
							},
						].map(({ href, label, icon: Icon, role }) => (
							<VerifyPermissions key={href} role={role ?? ""}>
								<SidebarMenuItem key={href}>
									<SidebarMenuButton
										asChild
										onClick={() =>
											isMobile ? setOpenMobile(false) : setOpen(false)
										}
									>
										<Link href={href}>
											<Icon className="mr-2 h-4 w-4" /> {label}
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							</VerifyPermissions>
						))}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<Button
					variant="ghost"
					className="w-full cursor-pointer"
					onClick={logout}
				>
					<LogOut className="mr-2 h-4 w-4" />
					{state == "expanded" ? "Sair" : ""}
				</Button>
			</SidebarFooter>
		</Sidebar>
	);
}

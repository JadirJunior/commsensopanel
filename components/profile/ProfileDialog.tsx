"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { User, Mail, Shield, Building2, UserCircle } from "lucide-react";
import { ReactNode } from "react";

interface ProfileDialogProps {
	children: ReactNode;
}

export function ProfileDialog({ children }: ProfileDialogProps) {
	const { user } = useAuth();

	if (!user) return null;

	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
				<DialogHeader>
					<DialogTitle className="text-center text-xl">Meu Perfil</DialogTitle>
					<DialogDescription className="text-center">
						Gerencie suas informações pessoais
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col items-center justify-center py-6 border-b border-border">
					<div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-3 ring-4 ring-background shadow-lg">
						<span className="text-3xl font-bold text-primary">
							{(user.name || user.username).charAt(0).toUpperCase()}
						</span>
					</div>
					<h3 className="text-lg font-semibold text-foreground">
						{user.name || user.username}
					</h3>
					<p className="text-sm text-muted-foreground">{user.email}</p>
				</div>

				<div className="space-y-4 py-4">
					<div className="grid grid-cols-[24px_1fr] gap-4 items-start">
						<User className="w-5 h-5 text-primary mt-0.5" />
						<div className="space-y-1">
							<p className="text-sm font-medium text-muted-foreground">
								Nome de Usuário
							</p>
							<p className="text-base font-medium text-foreground">
								{user.username}
							</p>
						</div>
					</div>

					<div className="grid grid-cols-[24px_1fr] gap-4 items-start">
						<Mail className="w-5 h-5 text-primary mt-0.5" />
						<div className="space-y-1">
							<p className="text-sm font-medium text-muted-foreground">Email</p>
							<p className="text-base font-medium text-foreground">
								{user.email}
							</p>
						</div>
					</div>

					<div className="grid grid-cols-[24px_1fr] gap-4 items-start">
						<Shield className="w-5 h-5 text-primary mt-0.5" />
						<div className="space-y-1">
							<p className="text-sm font-medium text-muted-foreground">
								ID do Usuário
							</p>
							<code className="text-xs bg-muted px-2 py-1 rounded text-foreground font-mono break-all block mt-1">
								{user.id}
							</code>
						</div>
					</div>

					{user.tenantId && (
						<div className="grid grid-cols-[24px_1fr] gap-4 items-start">
							<Building2 className="w-5 h-5 text-primary mt-0.5" />
							<div className="space-y-1">
								<p className="text-sm font-medium text-muted-foreground">
									Organização (Tenant)
								</p>
								<code className="text-xs bg-muted px-2 py-1 rounded text-foreground font-mono break-all block mt-1">
									{user.tenantId}
								</code>
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { TenantMember, RoleModel } from "@/types/auth";

interface UserDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (data: { userEmail?: string; tenantRoleId: string }) => Promise<void>;
	member?: TenantMember;
	roles: RoleModel[];
	isLoading?: boolean;
}

// Inner form component that gets re-mounted when key changes
function UserDialogForm({
	member,
	roles,
	isLoading,
	onSave,
	onClose,
}: {
	member?: TenantMember;
	roles: RoleModel[];
	isLoading: boolean;
	onSave: (data: { userEmail?: string; tenantRoleId: string }) => Promise<void>;
	onClose: () => void;
}) {
	const [email, setEmail] = useState(member?.user.email ?? "");
	const [selectedRoleId, setSelectedRoleId] = useState(
		member?.tenantRoleId ?? ""
	);

	const isEditing = !!member;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isEditing) {
			await onSave({ tenantRoleId: selectedRoleId });
		} else {
			await onSave({ userEmail: email, tenantRoleId: selectedRoleId });
		}
	};

	return (
		<>
			<DialogHeader>
				<DialogTitle>
					{isEditing ? "Alterar Cargo" : "Adicionar Membro"}
				</DialogTitle>
				<DialogDescription>
					{isEditing
						? `Altere o cargo de ${member.user.username} na instituição.`
						: "Adicione um novo membro à instituição pelo email."}
				</DialogDescription>
			</DialogHeader>
			<form onSubmit={handleSubmit}>
				<div className="grid gap-4 py-4">
					{!isEditing && (
						<div className="grid gap-2">
							<Label htmlFor="email">Email do Usuário</Label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="usuario@exemplo.com"
								required
							/>
							<p className="text-xs text-muted-foreground">
								O usuário deve estar cadastrado no sistema.
							</p>
						</div>
					)}
					{isEditing && (
						<div className="grid gap-2">
							<Label>Usuário</Label>
							<div className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-md border border-slate-700">
								<span className="text-white font-medium">
									{member.user.username}
								</span>
								<span className="text-slate-400">({member.user.email})</span>
							</div>
						</div>
					)}
					<div className="grid gap-2">
						<Label htmlFor="role">Cargo</Label>
						<Select
							value={selectedRoleId}
							onValueChange={setSelectedRoleId}
							required
						>
							<SelectTrigger className="w-full bg-background text-foreground border-input cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors">
								<SelectValue placeholder="Selecione um cargo" />
							</SelectTrigger>
							<SelectContent className="bg-popover text-popover-foreground border-border">
								{roles.map((role) => (
									<SelectItem
										key={role.id}
										value={role.id}
										className="cursor-pointer focus:bg-primary focus:text-primary-foreground"
									>
										{role.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={isLoading}
					>
						Cancelar
					</Button>
					<Button
						type="submit"
						disabled={isLoading || !selectedRoleId || (!isEditing && !email)}
					>
						{isLoading ? "Salvando..." : isEditing ? "Salvar" : "Adicionar"}
					</Button>
				</DialogFooter>
			</form>
		</>
	);
}

export function UserDialog({
	isOpen,
	onClose,
	onSave,
	member,
	roles,
	isLoading = false,
}: UserDialogProps) {
	// Use a key to force re-mount of the form when member changes or dialog opens
	const formKey = `${isOpen}-${member?.id ?? "new"}`;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
				<UserDialogForm
					key={formKey}
					member={member}
					roles={roles}
					isLoading={isLoading}
					onSave={onSave}
					onClose={onClose}
				/>
			</DialogContent>
		</Dialog>
	);
}

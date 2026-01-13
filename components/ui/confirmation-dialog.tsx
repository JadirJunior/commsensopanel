"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ConfirmationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	title: string;
	description: string;
	confirmText?: string;
	cancelText?: string;
	variant?: "default" | "destructive";
}

export function ConfirmationDialog({
	open,
	onOpenChange,
	onConfirm,
	title,
	description,
	confirmText = "Confirmar",
	cancelText = "Cancelar",
	variant = "destructive",
}: ConfirmationDialogProps) {
	const handleConfirm = () => {
		onConfirm();
		onOpenChange(false);
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
				<AlertDialogHeader>
					<AlertDialogTitle className="text-gray-900 dark:text-gray-100">
						{title}
					</AlertDialogTitle>
					<AlertDialogDescription className="text-gray-600 dark:text-gray-400">
						{description}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel className="border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
						{cancelText}
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleConfirm}
						className={cn(
							variant === "destructive"
								? "bg-red-600 text-white hover:bg-red-500 active:bg-red-700 focus-visible:ring-red-500"
								: "bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 focus-visible:ring-emerald-500"
						)}
					>
						{confirmText}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

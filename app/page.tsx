import Image from "next/image";

// Esta página é apenas um loading state enquanto o middleware redireciona
// O middleware já cuida de redirecionar para /login ou /dashboard
export default function Home() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-linear-to-br from-white via-emerald-50/30 to-teal-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
			<div className="text-center">
				<Image
					src="/commsenso-iot-logo.png"
					alt="CommSenso"
					width={64}
					height={64}
					className="mx-auto animate-pulse"
				/>
				<p className="mt-4 text-muted-foreground">Carregando...</p>
			</div>
		</div>
	);
}

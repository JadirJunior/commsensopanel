"use client";

import Image from "next/image";
import { useState } from "react";

interface LoadingPageProps {
	message?: string;
	showProgress?: boolean;
}

export function LoadingPage({
	message = "Loading...",
	showProgress = false,
}: LoadingPageProps) {
	const [imageError, setImageError] = useState(false);

	return (
		<div className="fixed inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 z-50 flex flex-col items-center justify-center">
			<div className="flex flex-col items-center space-y-8">
				{!imageError && (
					<Image
						src="/commsenso-logo.gif"
						alt="CommSenso Logo"
						width={0}
						height={0}
						className="w-96 drop-shadow-lg"
						priority
						unoptimized // Important for GIF animations
						onError={() => setImageError(true)}
					/>
				)}
			</div>
		</div>
	);
}

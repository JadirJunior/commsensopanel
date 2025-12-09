"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";

interface LoadingScreenProps {
	isLoading: boolean;
	onComplete?: () => void;
	minDuration?: number; // Duração mínima em ms
}

const loadingSteps = [
	"Conectando ao servidor...",
	"Verificando credenciais...",
	"Carregando suas instituições...",
	"Preparando o ambiente...",
	"Quase lá...",
];

// Gera valores pseudo-aleatórios baseados em um seed (índice)
function seededRandom(seed: number) {
	const x = Math.sin(seed * 9999) * 10000;
	return x - Math.floor(x);
}

export function LoadingScreen({
	isLoading,
	onComplete,
	minDuration = 2500,
}: LoadingScreenProps) {
	const [progress, setProgress] = useState(0);
	const [currentStep, setCurrentStep] = useState(0);
	const [shouldShow, setShouldShow] = useState(isLoading);

	// Gera as partículas com valores determinísticos baseados no índice
	const particles = useMemo(() => {
		return [...Array(20)].map((_, i) => ({
			initialX: seededRandom(i) * 100, // Percentual
			initialY: seededRandom(i + 100) * 100, // Percentual
			scale: seededRandom(i + 200) * 0.5 + 0.5,
			animateY: seededRandom(i + 300) * -200 - 100,
			duration: seededRandom(i + 400) * 3 + 2,
			delay: seededRandom(i + 500) * 2,
		}));
	}, []);

	useEffect(() => {
		if (!isLoading) return;

		setShouldShow(true);
		setProgress(0);
		setCurrentStep(0);

		// Progresso "fake" que acelera no final
		const progressInterval = setInterval(() => {
			setProgress((prev) => {
				if (prev >= 100) return 100;
				// Acelera mais no início, desacelera no meio, acelera no final
				const increment = prev < 30 ? 3 : prev < 70 ? 1.5 : prev < 90 ? 2 : 4;
				return Math.min(prev + increment, 100);
			});
		}, 50);

		// Atualiza o step baseado no progresso
		const stepInterval = setInterval(() => {
			setCurrentStep((prev) => {
				if (prev >= loadingSteps.length - 1) return prev;
				return prev + 1;
			});
		}, minDuration / loadingSteps.length);

		// Garante duração mínima
		const timeout = setTimeout(() => {
			setProgress(100);
			setTimeout(() => {
				setShouldShow(false);
				onComplete?.();
			}, 400);
		}, minDuration);

		return () => {
			clearInterval(progressInterval);
			clearInterval(stepInterval);
			clearTimeout(timeout);
		};
	}, [isLoading, minDuration, onComplete]);

	return (
		<AnimatePresence>
			{shouldShow && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.3 }}
					className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-950 to-black"
				>
					{/* Background animated particles */}
					<div className="absolute inset-0 overflow-hidden">
						{particles.map((particle, i) => (
							<motion.div
								key={i}
								className="absolute w-2 h-2 bg-emerald-500/20 rounded-full"
								style={{
									left: `${particle.initialX}%`,
									top: `${particle.initialY}%`,
								}}
								initial={{
									scale: particle.scale,
								}}
								animate={{
									y: [0, particle.animateY],
									opacity: [0, 1, 0],
								}}
								transition={{
									duration: particle.duration,
									repeat: Infinity,
									repeatType: "loop",
									delay: particle.delay,
								}}
							/>
						))}
					</div>

					{/* Main content */}
					<div className="relative z-10 flex flex-col items-center">
						{/* Logo container with glow effect */}
						<motion.div
							initial={{ scale: 0.5, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{
								type: "spring",
								stiffness: 200,
								damping: 15,
								delay: 0.1,
							}}
							className="relative"
						>
							{/* Glow effect */}
							<motion.div
								className="absolute inset-0 blur-2xl"
								animate={{
									scale: [1, 1.2, 1],
									opacity: [0.3, 0.6, 0.3],
								}}
								transition={{
									duration: 2,
									repeat: Infinity,
									ease: "easeInOut",
								}}
							>
								<div className="w-32 h-32 bg-emerald-500 rounded-full" />
							</motion.div>

							{/* Logo */}
							<motion.div
								animate={{
									y: [0, -8, 0],
								}}
								transition={{
									duration: 2,
									repeat: Infinity,
									ease: "easeInOut",
								}}
								className="relative"
							>
								<Image
									src="/commsenso-iot-logo.png"
									alt="CommSenso"
									width={120}
									height={120}
									className="relative z-10"
									priority
								/>
							</motion.div>
						</motion.div>

						{/* Brand name */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3, duration: 0.5 }}
							className="mt-6 text-center"
						>
							<h1 className="text-3xl font-bold text-white tracking-tight">
								Comm
								<span className="text-emerald-400">Senso</span>
							</h1>
							<p className="text-sm text-gray-400 mt-1">IoT Platform</p>
						</motion.div>

						{/* Progress bar */}
						<motion.div
							initial={{ opacity: 0, width: 0 }}
							animate={{ opacity: 1, width: 280 }}
							transition={{ delay: 0.5, duration: 0.3 }}
							className="mt-10"
						>
							<div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
								<motion.div
									className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 rounded-full"
									initial={{ width: "0%" }}
									animate={{ width: `${progress}%` }}
									transition={{ duration: 0.1 }}
								/>
							</div>

							{/* Progress percentage */}
							<motion.div
								className="flex justify-between items-center mt-3"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.6 }}
							>
								<span className="text-xs text-gray-500">
									{Math.round(progress)}%
								</span>
								<motion.span
									key={currentStep}
									initial={{ opacity: 0, x: 10 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -10 }}
									className="text-xs text-emerald-400"
								>
									{loadingSteps[currentStep]}
								</motion.span>
							</motion.div>
						</motion.div>

						{/* Loading dots */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.8 }}
							className="flex gap-1.5 mt-8"
						>
							{[0, 1, 2].map((i) => (
								<motion.div
									key={i}
									className="w-2 h-2 bg-emerald-500 rounded-full"
									animate={{
										scale: [1, 1.3, 1],
										opacity: [0.5, 1, 0.5],
									}}
									transition={{
										duration: 0.8,
										repeat: Infinity,
										delay: i * 0.15,
									}}
								/>
							))}
						</motion.div>
					</div>

					{/* Bottom gradient */}
					<div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-emerald-950/20 to-transparent" />
				</motion.div>
			)}
		</AnimatePresence>
	);
}

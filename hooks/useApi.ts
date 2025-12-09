"use client";

import { useState, useCallback } from "react";
import { apiService } from "@/lib/api";
import { ApiResponse } from "@/types/api";

interface UseApiOptions<T> {
	onSuccess?: (data: T, response: ApiResponse<T>) => void;
	onError?: (error: Error) => void;
}

export function useApi<T = unknown>(url: string, options?: UseApiOptions<T>) {
	const [data, setData] = useState<T | null>(null);
	const [response, setResponse] = useState<ApiResponse<T> | null>(null);
	const [error, setError] = useState<Error | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const execute = useCallback(
		async (fetchOptions?: RequestInit) => {
			try {
				setIsLoading(true);
				setError(null);

				const result = await apiService.fetchWithAuth<T>(url, fetchOptions);

				setResponse(result);

				if (result.data) {
					setData(result.data);
				}

				if (options?.onSuccess && result.data) {
					options.onSuccess(result.data, result);
				}

				return result;
			} catch (err) {
				const error =
					err instanceof Error ? err : new Error("Erro desconhecido");
				setError(error);

				if (options?.onError) {
					options.onError(error);
				}

				throw error;
			} finally {
				setIsLoading(false);
			}
		},
		[url, options]
	);

	return {
		data,
		response, // Resposta completa incluindo message, total, status, success
		error,
		isLoading,
		execute,
	};
}

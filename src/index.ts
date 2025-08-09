import type { z } from "zod";
import type {
	ErrorResponse,
	SendBulkEmailSuccessResponse,
	SendEmailSuccessResponse,
	SmtpConfig,
} from "./types";
import type { sendBulkEmailInputSchema, sendEmailInputSchema } from "./zod";

export class Mailer {
	private baseUrl: string;
	private config: SmtpConfig;

	constructor(config: SmtpConfig) {
		this.baseUrl = "https://mail-server.efobi.dev";
		this.config = config;
	}

	private async post<T extends z.ZodTypeAny, U>(
		endpoint: string,
		data: z.infer<T>,
	): Promise<U> {
		const response = await fetch(`${this.baseUrl}${endpoint}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ ...(data as object), smtpConfig: this.config }),
		});

		const result = await response.json();

		if (!response.ok) {
			const error = result as ErrorResponse;
			const errorMessage = Array.isArray(error.error)
				? error.error.join(", ")
				: error.error;
			throw new Error(errorMessage || "Failed to send request");
		}

		return result as U;
	}

	async send(data: z.infer<typeof sendEmailInputSchema>) {
		return this.post<typeof sendEmailInputSchema, SendEmailSuccessResponse>(
			"/email",
			data,
		);
	}

	async bulk(data: z.infer<typeof sendBulkEmailInputSchema>) {
		return this.post<
			typeof sendBulkEmailInputSchema,
			SendBulkEmailSuccessResponse
		>("/bulk-email", data);
	}
}

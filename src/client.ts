import type { z } from "zod";
import type {
	ErrorResponse,
	SendBulkEmailSuccessResponse,
	SendEmailSuccessResponse,
} from "./types";
import type { bulkEmailInputSchema, emailInputSchema } from "./zod";

export class MailerClient {
	private baseUrl: string;

	constructor() {
		this.baseUrl = 'https://mail-server.efobi.dev';
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
			body: JSON.stringify(data),
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

	async sendEmail(data: z.infer<typeof emailInputSchema>) {
		return this.post<typeof emailInputSchema, SendEmailSuccessResponse>(
			"/email",
			data,
		);
	}

	async sendBulkEmail(data: z.infer<typeof bulkEmailInputSchema>) {
		return this.post<typeof bulkEmailInputSchema, SendBulkEmailSuccessResponse>(
			"/bulk-email",
			data,
		);
	}
}

export const mailerClient = new MailerClient();
import type z from "zod";
import type { smtpConfigSchema } from "./zod";

export type SmtpConfig = z.infer<typeof smtpConfigSchema>;

export type SendEmailSuccessResponse = {
	message: string;
	messageId: string;
	response: string;
};

export type BulkEmailSuccessResult = {
	to: string | string[];
	success: true;
	messageId: string;
};

export type BulkEmailErrorResult = {
	to: string | string[];
	success: false;
	error: string;
};

export type BulkEmailResult = BulkEmailSuccessResult | BulkEmailErrorResult;

export type SendBulkEmailSuccessResponse = {
	success: boolean;
	results: BulkEmailResult[];
	total: number;
	successful: number;
	failed: number;
};

export type ErrorResponse = {
	error: string | string[];
};

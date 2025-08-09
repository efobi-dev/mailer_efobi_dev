import { z } from "zod";

export const smtpConfigSchema = z.object({
	host: z.string().min(1, "SMTP host is required"),
	port: z.number().int().positive().optional(),
	secure: z.boolean().optional(),
	auth: z.object({
		user: z.email("Invalid email address"),
		pass: z.string().min(1, "Password is required"),
	}),
});

export const sendEmailInputSchema = z.object({
	from: z.string(),
	to: z
		.email("Invalid recipient email address")
		.or(z.array(z.email("Invalid recipient email address"))),
	subject: z.string().min(1, "Subject is required"),
	text: z.string().min(1, "Text body is required").optional(),
	html: z.string().min(1, "HTML body is required").optional(),
	attachments: z
		.instanceof(File)
		.or(z.array(z.instanceof(File)))
		.optional(),
	replyTo: z.email().optional(),
	cc: z
		.email("Invalid recipient email address")
		.or(z.array(z.email("Invalid recipient email address")))
		.optional(),
	bcc: z
		.email("Invalid recipient email address")
		.or(z.array(z.email("Invalid recipient email address")))
		.optional(),
	priority: z.enum(["high", "normal", "low"]).optional().default("normal"),
});

export const sendBulkEmailInputSchema = z.object({
	emails: z.array(sendEmailInputSchema),
});

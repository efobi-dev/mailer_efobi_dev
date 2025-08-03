import { RedisStore } from "@hono-rate-limiter/redis";
import { Redis } from "@upstash/redis";
import { type Context, Hono } from "hono";
import { rateLimiter } from "hono-rate-limiter";
import { createTransport } from "nodemailer";
import type { z } from "zod";
import { env } from "./env";
import { bulkEmailInputSchema, emailInputSchema } from "./zod";

const app = new Hono();

const redis = new Redis({
	url: env.UPSTASH_REDIS_REST_URL,
	token: env.UPSTASH_REDIS_REST_TOKEN,
});

const store = new RedisStore({ client: redis });

const limiter = rateLimiter({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per windowMs
	store,
	keyGenerator: (c) =>
		c.req.header("CF-Connecting-IP") ||
		c.req.header("X-Forwarded-For") ||
		c.req.header("X-Real-IP") ||
		"unknown",
});

app.get("/health", (c) => {
	return c.json({ status: "OK", timestamp: new Date().toISOString() });
});

const handleAttachments = async (
	attachments: z.infer<typeof emailInputSchema>["attachments"],
) => {
	if (!attachments) return [];

	const processAttachment = async (attachment: File) => ({
		filename: attachment.name || "attachment",
		content: Buffer.from(await attachment.arrayBuffer()),
		contentType: attachment.type,
	});

	return Array.isArray(attachments)
		? Promise.all(attachments.map(processAttachment))
		: [await processAttachment(attachments)];
};

const handleHonoRequest = async <T extends z.ZodTypeAny>(
	c: Context,
	schema: T,
	handler: (data: z.infer<T>) => Promise<any>,
) => {
	try {
		const body = await c.req.json();
		const { data, error } = await schema.safeParseAsync(body);

		if (error) {
			return c.json({ error: error.issues.map((e) => e.message) }, 400);
		}

		return handler(data);
	} catch (error) {
		return c.json(
			{ error: error instanceof Error ? error.message : "Unknown error" },
			500,
		);
	}
};

app.post("/email", (c) =>
	handleHonoRequest(c, emailInputSchema, async (data) => {
		const transporter = createTransport({
			...data.smtpConfig,
			port: data.smtpConfig.port || (data.smtpConfig.secure ? 465 : 587),
			connectionTimeout: 10000,
			greetingTimeout: 5000,
			socketTimeout: 10000,
		});

		await transporter.verify();

		const attachments = await handleAttachments(data.attachments);

		const mailOptions = {
			...data,
			to: Array.isArray(data.to) ? data.to.join(", ") : data.to,
			cc: Array.isArray(data.cc) ? data.cc.join(", ") : data.cc,
			bcc: Array.isArray(data.bcc) ? data.bcc.join(", ") : data.bcc,
			attachments,
		};

		const res = await transporter.sendMail(mailOptions);
		console.log("Email sent successfully:", res.messageId);

		return c.json({
			message: "Email sent successfully",
			messageId: res.messageId,
			response: res.response,
		});
	}),
);

app.post("/bulk-email", (c) =>
	handleHonoRequest(c, bulkEmailInputSchema, async (data) => {
		const transporter = createTransport({
			...data.smtpConfig,
			pool: true,
			maxConnections: 5,
			maxMessages: 100,
		});

		await transporter.verify();

		const results = await Promise.all(
			data.emails.map(async (email) => {
				try {
					const attachments = await handleAttachments(email.attachments);
					const mailOptions = {
						...email,
						to: Array.isArray(email.to) ? email.to.join(", ") : email.to,
						cc: Array.isArray(email.cc) ? email.cc.join(", ") : email.cc,
						bcc: Array.isArray(email.bcc) ? email.bcc.join(", ") : email.bcc,
						attachments,
					};
					const info = await transporter.sendMail(mailOptions);
					return { to: email.to, success: true, messageId: info.messageId };
				} catch (error) {
					return {
						to: email.to,
						success: false,
						error: error instanceof Error ? error.message : "Unknown error",
					};
				}
			}),
		);

		transporter.close();

		return c.json({
			success: true,
			results,
			total: data.emails.length,
			successful: results.filter((r) => r.success).length,
			failed: results.filter((r) => !r.success).length,
		});
	}),
);
app.use(limiter);

export default app;

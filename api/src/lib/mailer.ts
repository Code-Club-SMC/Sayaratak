import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: Number(process.env.SMTP_PORT),
	secure: Number(process.env.SMTP_PORT) === 465,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

const fromAddress = `"Sayaratak" <${process.env.SMTP_USER}>`;

export async function sendVerificationEmail({
	email,
	url,
	token,
}: {
	email: string;
	url: string;
	token: string;
}) {
	await transport.sendMail({
		from: fromAddress,
		to: email,
		subject: "Verify your email address",
		html: `
			<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
				<h2 style="color: #1e3a8a; margin-top: 0;">Sayaratak (سيارتك)</h2>
				<h3 style="color: #111827; font-size: 18px;">Verify your email address</h3>
				<p style="color: #4b5563; font-size: 15px; line-height: 1.5;">Thank you for registering on Sayaratak. Please verify your email address to activate your account and start exploring the marketplace.</p>
				<div style="margin: 24px 0;">
					<a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 6px; font-size: 15px;">
						Verify Email Address
					</a>
				</div>
				<p style="color: #dc2626; font-size: 13px; font-weight: 500;">
					⏱️ This verification link expires in <strong>1 hour</strong>.
				</p>
				<p style="color: #6b7280; font-size: 13px; margin-top: 20px; line-height: 1.4;">
					If the button above does not work, copy and paste this link into your browser:<br />
					<a href="${url}" style="color: #2563eb; word-break: break-all;">${url}</a>
				</p>
			</div>
		`,
	});
}

export async function sendResetPasswordEmail({
	email,
	url,
	token,
}: {
	email: string;
	url: string;
	token: string;
}) {
	await transport.sendMail({
		from: fromAddress,
		to: email,
		subject: "Reset your Sayaratak password",
		html: `
			<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
				<h2 style="color: #1e3a8a; margin-top: 0;">Sayaratak (سيارتك)</h2>
				<h3 style="color: #111827; font-size: 18px;">Password Reset Request</h3>
				<p style="color: #4b5563; font-size: 15px; line-height: 1.5;">We received a request to reset the password for your Sayaratak account. Click the button below to choose a new password:</p>
				<div style="margin: 24px 0;">
					<a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 6px; font-size: 15px;">
						Reset Password
					</a>
				</div>
				<p style="color: #dc2626; font-size: 13px; font-weight: 500;">
					⏱️ This password reset link is valid for <strong>1 hour</strong>.
				</p>
				<p style="color: #6b7280; font-size: 13px; margin-top: 20px; line-height: 1.4;">
					If the button above does not work, copy and paste this link into your browser:<br />
					<a href="${url}" style="color: #2563eb; word-break: break-all;">${url}</a>
				</p>
				<p style="color: #6b7280; font-size: 13px; margin-top: 16px; border-top: 1px solid #f3f4f6; padding-top: 12px;">
					Security notice: If you did not request a password reset, your account is safe and you can safely ignore this email.
				</p>
			</div>
		`,
	});
}

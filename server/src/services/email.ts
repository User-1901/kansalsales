import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(to: string, displayName: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: 'Verify your Kansal Sales account',
    text: `Hi ${displayName},\n\nThank you for registering with Kansal Sales. Please verify your email address to activate your account.\n\nKansal Sales Team`,
    html: `<p>Hi ${displayName},</p><p>Thank you for registering with Kansal Sales. Please verify your email address to activate your account.</p><p>Kansal Sales Team</p>`,
  });
}

export async function sendContactEmail(name: string, email: string, message: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.SMTP_USER,
    replyTo: email,
    subject: `Contact form message from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong></p><p>${message}</p>`,
  });
}

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: 'Reset your Kansal Sales password',
    text: `You requested a password reset.\n\nClick the link below to reset your password (valid for 1 hour):\n${resetLink}\n\nIf you did not request this, ignore this email.\n\nKansal Sales Team`,
    html: `
      <p>You requested a password reset.</p>
      <p>Click the button below to reset your password. This link is valid for <strong>1 hour</strong>.</p>
      <p><a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">Reset Password</a></p>
      <p>Or copy this link: <a href="${resetLink}">${resetLink}</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <p>Kansal Sales Team</p>
    `,
  });
}

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "noreply@kujawab.com",
    to: email,
    subject: "Reset Kata Sandi - Kujawab",
    html: `
      <p>Halo,</p>
      <p>Kami menerima permintaan untuk mereset kata sandi akun Kujawab Anda.</p>
      <p><a href="${resetUrl}">Klik di sini untuk mereset kata sandi</a></p>
      <p>Link ini berlaku selama 1 jam.</p>
      <p>Jika Anda tidak meminta reset kata sandi, abaikan email ini.</p>
    `,
  });
}

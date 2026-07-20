import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || 'AgriLink <noreply@agrilink.app>';

if (!host || !user || !pass) {
  console.warn('SMTP environment variables are not fully set. Email OTPs may not send.');
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: false,
  auth: user && pass ? { user, pass } : undefined,
});

export async function sendEmailOtp(to: string, otp: string, purpose: string) {
  if (!host || !user || !pass) {
    console.warn('Skipping email send because SMTP env vars are missing');
    return;
  }

  const subject = `Your AgriLink OTP for ${purpose}`;
  const text = `Your AgriLink OTP is ${otp}. It is valid for 10 minutes.`;

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text,
    });
    console.log('OTP email sent to', to);
  } catch (err) {
    console.error('Failed to send OTP email', err);
  }
}

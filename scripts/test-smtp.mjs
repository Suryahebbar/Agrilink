import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Read .env.local manually for standalone script
const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    const key = trimmed.substring(0, idx).trim();
    let val = trimmed.substring(idx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    envVars[key] = val;
  }
});

async function testSmtpConnection() {
  console.log('Testing SMTP connection...');
  console.log('Host:', envVars.SMTP_HOST || 'smtp.gmail.com');
  console.log('Port:', envVars.SMTP_PORT || 587);
  console.log('User:', envVars.SMTP_USER);

  const transporter = nodemailer.createTransport({
    host: envVars.SMTP_HOST || 'smtp.gmail.com',
    port: Number(envVars.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: envVars.SMTP_USER,
      pass: envVars.SMTP_PASS,
    },
  });

  try {
    await transporter.verify();
    console.log('✅ Nodemailer SMTP Server is configured and connected successfully!');
  } catch (error) {
    console.error('❌ SMTP Connection Error:', error);
  }
}

testSmtpConnection();

import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST || 'smtp.gmail.com';
const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || 'AgriLink <noreply@agrilink.app>';

if (!user || !pass) {
  console.warn('️ SMTP credentials are missing in environment variables. Email notifications will be logged to console.');
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: user && pass ? { user, pass } : undefined,
});

/**
 * Send Two-Factor OTP Email during Registration / Login
 */
export async function sendEmailOtp(to: string, otp: string, purpose: string = 'Verification') {
  const subject = ` AgriLink: Your Verification Code is ${otp}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4fbf7; margin: 0; padding: 20px; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; }
          .header { background: linear-gradient(135deg, #14532d, #166534); padding: 32px 24px; text-align: center; color: #ffffff; }
          .logo { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; margin: 0; }
          .subtitle { font-size: 13px; color: #bbf7d0; margin-top: 4px; }
          .content { padding: 32px 28px; color: #374151; font-size: 14px; line-height: 1.6; }
          .otp-box { margin: 24px 0; padding: 20px; background: #f0fdf4; border: 2px dashed #166534; border-radius: 12px; text-align: center; }
          .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #14532d; font-family: monospace; }
          .warning { font-size: 12px; color: #6b7280; margin-top: 12px; }
          .footer { background: #fafaf9; padding: 20px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo"> AgriLink</h1>
            <div class="subtitle">Next-Gen Agricultural Intelligence & Farm Pooling</div>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You requested a one-time verification code for <strong>${purpose}</strong> on the AgriLink platform.</p>
            
            <div class="otp-box">
              <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #15803d; margin-bottom: 8px;">Your One-Time Password (OTP)</div>
              <div class="otp-code">${otp}</div>
              <div class="warning">⏰ Valid for 10 minutes. Never share this code with anyone.</div>
            </div>

            <p style="font-size: 13px; color: #4b5563;">
              If you did not initiate this request, please disregard this message or contact AgriLink Support immediately.
            </p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} AgriLink Technologies Pvt. Ltd. All rights reserved.<br/>
            Secured with Double Authentication & Blockchain Ledger
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `Your AgriLink OTP for ${purpose} is: ${otp}. It is valid for 10 minutes. Please do not share it with anyone.`;

  try {
    if (user && pass) {
      await transporter.sendMail({
        from: from || `AgriLink <${user}>`,
        to,
        subject,
        text,
        html,
        headers: {
          'X-Priority': '1', // High priority
          'X-MSMail-Priority': 'High',
          'Importance': 'high',
          'X-Mailer': 'AgriLink Security Mailer v2',
        },
      });
      console.log(' OTP email dispatched via SMTP to:', to);
    } else {
      console.log(' [DEV SIMULATION] OTP email for', to, ':', otp);
    }
    return { success: true };
  } catch (err: any) {
    console.error(' Failed to send OTP email via SMTP:', err);
    return { success: false, error: err.message || 'SMTP dispatch error' };
  }
}

/**
 * Send Welcome Email on First Successful Sign-In
 */
export async function sendWelcomeEmail(to: string, fullName: string, role: string = 'farmer') {
  const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1);
  const subject = ` Welcome to AgriLink, ${fullName}! Your Account is Active`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4fbf7; margin: 0; padding: 20px; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 6px 24px rgba(0,0,0,0.07); border: 1px solid #e5e7eb; }
          .header { background: linear-gradient(135deg, #14532d 0%, #166534 60%, #15803d 100%); padding: 36px 28px; text-align: center; color: #ffffff; }
          .logo { font-size: 28px; font-weight: 900; letter-spacing: -0.5px; margin: 0; }
          .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-top: 10px; }
          .content { padding: 32px 30px; color: #374151; font-size: 14px; line-height: 1.6; }
          .highlight-card { background: #f0fdf4; border-left: 4px solid #166534; padding: 16px 20px; border-radius: 8px; margin: 20px 0; }
          .feature-list { margin: 20px 0; padding: 0; list-style: none; }
          .feature-item { padding: 8px 0; display: flex; align-items: flex-start; font-size: 13px; color: #4b5563; }
          .feature-icon { color: #166534; font-weight: bold; margin-right: 10px; }
          .btn-container { text-align: center; margin: 28px 0; }
          .btn { background: #166534; color: #ffffff !important; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 12px; display: inline-block; font-size: 14px; box-shadow: 0 4px 12px rgba(22,101,52,0.3); }
          .footer { background: #fafaf9; padding: 24px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo"> Welcome to AgriLink!</h1>
            <div class="badge">Verified ${roleDisplay} Portal</div>
          </div>
          <div class="content">
            <p>Dear <strong>${fullName}</strong>,</p>
            <p>Welcome to the <strong>AgriLink Family</strong>! Your account has been verified and your first login was successful.</p>
            
            <div class="highlight-card">
              <strong style="color: #14532d; font-size: 15px;">Your Digital Farm Operations Hub</strong>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #166534;">
                You now have full access to intelligent collaborative pooling, Government PMFBY & private crop insurance, AI price predictions, and smart contract ledgers.
              </p>
            </div>

            <h3 style="font-size: 14px; color: #111827; margin-bottom: 8px;">What You Can Do Next:</h3>
            <ul class="feature-list">
              <li class="feature-item">
                <span class="feature-icon"></span>
                <span><strong>Digital Farm Pooling:</strong> Collaborate with neighboring farmers, share equipment, and boost harvest profits.</span>
              </li>
              <li class="feature-item">
                <span class="feature-icon"></span>
                <span><strong>Crop Insurance (Module 11):</strong> Access PMFBY & top private multi-peril policies with FCO inspection backing.</span>
              </li>
              <li class="feature-item">
                <span class="feature-icon"></span>
                <span><strong>Government Schemes:</strong> Real-time scheme discovery tailored to your land parcel RTC.</span>
              </li>
              <li class="feature-item">
                <span class="feature-icon"></span>
                <span><strong>AgriLink Marketplace:</strong> Procure certified seeds, bio-fertilizers, and farm machinery directly from verified suppliers.</span>
              </li>
            </ul>

            <p style="font-size: 13px; color: #4b5563;">
              Need assistance? Your assigned Field Counseling Officer (FCO) and the AgriLink support team are always available to help.
            </p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} AgriLink Technologies Pvt. Ltd.<br/>
            Empowering Indian Agriculture through Smart Collaboration
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `Welcome to AgriLink, ${fullName}! Your ${roleDisplay} account has been verified and is now fully active. Visit your dashboard to explore farm pooling, crop insurance, government schemes, and the marketplace.`;

  try {
    if (user && pass) {
      await transporter.sendMail({
        from: from || `AgriLink <${user}>`,
        to,
        subject,
        text,
        html,
        headers: {
          'X-Mailer': 'AgriLink Welcome Mailer v2',
          'List-Unsubscribe': `<mailto:${user}?subject=unsubscribe>`,
        },
      });
      console.log(' Welcome email dispatched via SMTP to:', to);
    } else {
      console.log(' [DEV SIMULATION] Welcome email for', to, ':', fullName);
    }
    return { success: true };
  } catch (err: any) {
    console.error(' Failed to send Welcome email via SMTP:', err);
    return { success: false, error: err.message || 'SMTP dispatch error' };
  }
}

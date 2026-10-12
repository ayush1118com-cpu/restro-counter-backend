import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface OnboardingEmailParams {
  toEmail: string;
  recipientName: string;
  restaurantName: string;
  adminEmail: string;
  adminPassword: string;
  kitchenEmail: string;
  kitchenPassword: string;
  portalUrl?: string;
}

export class EmailService {
  /**
   * Send Welcome & Onboarding Credentials Email via Brevo REST API
   * Compatible with Vercel, Render, Node.js without SMTP timeout issues
   */
  public static async sendRestaurantOnboardingEmail(params: OnboardingEmailParams): Promise<boolean> {
    const {
      toEmail,
      recipientName,
      restaurantName,
      adminEmail,
      adminPassword,
      kitchenEmail,
      kitchenPassword,
      portalUrl = env.FRONTEND_URL || 'http://localhost:3000',
    } = params;

    if (!env.BREVO_API_KEY) {
      logger.warn('BREVO_API_KEY missing. Skipping onboarding email dispatch.');
      return false;
    }

    const loginUrl = `${portalUrl}/login`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to ServDesk</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f9fc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); padding: 35px 30px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0 0 6px 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; }
    .header p { margin: 0; font-size: 13px; font-weight: 600; opacity: 0.95; letter-spacing: 0.5px; text-transform: uppercase; }
    .content { padding: 32px 30px; }
    .welcome-text { font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px; margin-bottom: 20px; }
    .card-title { font-size: 13px; font-weight: 800; color: #d97706; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    .credential-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #cbd5e1; font-size: 14px; }
    .credential-row:last-child { border-bottom: none; }
    .label { color: #64748b; font-weight: 600; }
    .value { color: #0f172a; font-weight: 800; font-family: monospace; background: #ffffff; padding: 2px 8px; border-radius: 6px; border: 1px solid #e2e8f0; }
    .cta-container { text-align: center; margin: 32px 0 20px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: #ffffff !important; text-decoration: none; font-weight: 800; font-size: 15px; padding: 14px 34px; border-radius: 12px; box-shadow: 0 6px 16px rgba(245, 158, 11, 0.35); }
    .footer { background: #f1f5f9; padding: 22px 30px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .footer strong { color: #0f172a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ServDesk</h1>
      <p>Powered by Alvora Tech Solution</p>
    </div>

    <div class="content">
      <div class="welcome-text">
        Hello <strong>${recipientName}</strong>,<br><br>
        Congratulations! Your restaurant <strong>${restaurantName}</strong> has been successfully registered on <strong>ServDesk</strong>.
        Below are your official portal credentials for Counter POS and Kitchen Display System (KDS).
      </div>

      <!-- Admin POS Credentials -->
      <div class="card">
        <div class="card-title">1. Restaurant Admin & Counter POS Portal</div>
        <div class="credential-row">
          <span class="label">Portal URL:</span>
          <span class="value">${loginUrl}</span>
        </div>
        <div class="credential-row">
          <span class="label">Admin Email:</span>
          <span class="value">${adminEmail}</span>
        </div>
        <div class="credential-row">
          <span class="label">Password:</span>
          <span class="value">${adminPassword}</span>
        </div>
      </div>

      <!-- Kitchen Display Credentials -->
      <div class="card">
        <div class="card-title">2. Kitchen Staff / KDS Display Terminal</div>
        <div class="credential-row">
          <span class="label">Kitchen Email:</span>
          <span class="value">${kitchenEmail}</span>
        </div>
        <div class="credential-row">
          <span class="label">Kitchen Password:</span>
          <span class="value">${kitchenPassword}</span>
        </div>
      </div>

      <div class="cta-container">
        <a href="${loginUrl}" class="btn" target="_blank">Login to ServDesk Portal</a>
      </div>

      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">
        For security reasons, please change your default password after your first login.
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0;"><strong>ServDesk</strong> &bull; Powered by Alvora Tech Solution</p>
      <p style="margin: 0 0 6px 0;">Helpline: 8385973582 | Email: alvora.tech.solution@gmail.com</p>
      <p style="margin: 0;">Jaipur, Rajasthan, India</p>
    </div>
  </div>
</body>
</html>
    `;

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': env.BREVO_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: env.BREVO_SENDER_NAME || 'ServDesk',
            email: env.BREVO_SENDER_EMAIL || 'alvora.tech.solution@gmail.com',
          },
          to: [
            {
              email: toEmail,
              name: recipientName,
            },
          ],
          subject: `Welcome to ServDesk - Credentials for ${restaurantName}`,
          htmlContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error(`Brevo Email dispatch failed (${response.status}): ${JSON.stringify(errorData)}`);
        return false;
      }

      const resData = (await response.json()) as any;
      logger.info(`Onboarding email successfully sent to ${toEmail} via Brevo! MessageId: ${resData?.messageId}`);
      return true;
    } catch (err: any) {
      logger.error(`Failed to send onboarding email via Brevo: ${err.message}`);
      return false;
    }
  }
}

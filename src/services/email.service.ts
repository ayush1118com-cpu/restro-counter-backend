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
   * Fully mobile-responsive, email-client compliant HTML template
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

    const loginUrl = `${portalUrl.replace(/\/+$/, '')}/login`;

    const htmlContent = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <title>Welcome to ServDesk - Credentials</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      min-width: 100%;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .break-word {
      word-break: break-all;
      word-wrap: break-word;
      overflow-wrap: anywhere;
    }
    @media only screen and (max-width: 620px) {
      .email-wrapper { padding: 10px 8px !important; }
      .email-card { width: 100% !important; max-width: 100% !important; border-radius: 16px !important; }
      .header-cell { padding: 26px 18px !important; }
      .content-cell { padding: 20px 16px !important; }
      .cred-box { padding: 14px 12px !important; }
      .btn-block { width: 100% !important; display: block !important; box-sizing: border-box !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
  <!-- Outer Wrapper Table -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; table-layout: fixed;">
    <tr>
      <td align="center" class="email-wrapper" style="padding: 24px 12px;">
        
        <!-- Main Email Container (Max 580px) -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-card" style="max-width: 580px; width: 100%; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
          
          <!-- BRAND HEADER -->
          <tr>
            <td class="header-cell" style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); padding: 36px 28px; text-align: center; color: #ffffff;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); padding: 8px 16px; border-radius: 100px; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; color: #ffffff;">
                      ⚡ Fast Counter POS &amp; Kitchen System
                    </div>
                    <h1 style="margin: 0 0 6px 0; font-size: 32px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; line-height: 1.1;">
                      ServDesk
                    </h1>
                    <p style="margin: 0; font-size: 12px; font-weight: 700; color: #ffedd5; letter-spacing: 0.5px; text-transform: uppercase;">
                      Powered by Alvora Tech Solution
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN BODY CONTENT -->
          <tr>
            <td class="content-cell" style="padding: 32px 28px; background-color: #ffffff;">
              
              <!-- Greeting & Info -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-size: 15px; line-height: 1.6; color: #334155;">
                    <p style="margin: 0 0 12px 0; font-size: 18px; font-weight: 800; color: #0f172a;">
                      Hello ${recipientName || 'Partner'} 👋
                    </p>
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                      Congratulations! Your restaurant <strong style="color: #0f172a; font-weight: 800;">${restaurantName}</strong> has been successfully onboarded on <strong>ServDesk</strong>. Below are your official login credentials.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CREDENTIALS CARD 1: RESTAURANT ADMIN & POS -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="cred-box" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 20px; box-sizing: border-box;">
                <tr>
                  <td>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 14px; border-bottom: 1px solid #e2e8f0;">
                          <span style="font-size: 13px; font-weight: 800; color: #d97706; text-transform: uppercase; letter-spacing: 0.5px;">
                            🖥️ Restaurant Admin &amp; POS Portal
                          </span>
                        </td>
                      </tr>
                      <!-- Portal URL -->
                      <tr>
                        <td style="padding: 12px 0 6px 0;">
                          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
                            Login Portal URL
                          </div>
                          <div class="break-word" style="font-size: 13px; font-family: Consolas, Monaco, monospace; font-weight: 700; color: #0284c7; background: #ffffff; padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1;">
                            <a href="${loginUrl}" target="_blank" style="color: #0284c7; text-decoration: none;">${loginUrl}</a>
                          </div>
                        </td>
                      </tr>
                      <!-- Admin Email -->
                      <tr>
                        <td style="padding: 6px 0;">
                          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
                            Admin Email (Username)
                          </div>
                          <div class="break-word" style="font-size: 13px; font-family: Consolas, Monaco, monospace; font-weight: 800; color: #0f172a; background: #ffffff; padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1;">
                            ${adminEmail}
                          </div>
                        </td>
                      </tr>
                      <!-- Password -->
                      <tr>
                        <td style="padding: 6px 0 2px 0;">
                          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
                            Admin Password
                          </div>
                          <div class="break-word" style="font-size: 14px; font-family: Consolas, Monaco, monospace; font-weight: 900; color: #d97706; background: #ffffff; padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1;">
                            ${adminPassword}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CREDENTIALS CARD 2: KITCHEN DISPLAY SYSTEM (KDS) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="cred-box" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 24px; box-sizing: border-box;">
                <tr>
                  <td>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 14px; border-bottom: 1px solid #e2e8f0;">
                          <span style="font-size: 13px; font-weight: 800; color: #ea580c; text-transform: uppercase; letter-spacing: 0.5px;">
                            👨‍🍳 Kitchen KDS Station Terminal
                          </span>
                        </td>
                      </tr>
                      <!-- Kitchen Email -->
                      <tr>
                        <td style="padding: 12px 0 6px 0;">
                          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
                            Kitchen Staff Email
                          </div>
                          <div class="break-word" style="font-size: 13px; font-family: Consolas, Monaco, monospace; font-weight: 800; color: #0f172a; background: #ffffff; padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1;">
                            ${kitchenEmail}
                          </div>
                        </td>
                      </tr>
                      <!-- Kitchen Password -->
                      <tr>
                        <td style="padding: 6px 0 2px 0;">
                          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
                            Kitchen Station Password
                          </div>
                          <div class="break-word" style="font-size: 14px; font-family: Consolas, Monaco, monospace; font-weight: 900; color: #ea580c; background: #ffffff; padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1;">
                            ${kitchenPassword}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CALL TO ACTION BUTTON -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 8px 0 24px 0;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${loginUrl}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="25%" fillcolor="#ea580c">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">Login to ServDesk Portal &rarr;</center>
                    </v:roundrect>
                    <![endif]-->
                    <a href="${loginUrl}" class="btn-block" target="_blank" style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); background-color: #ea580c; color: #ffffff !important; display: inline-block; font-size: 15px; font-weight: 800; line-height: 48px; text-align: center; text-decoration: none; width: auto; padding: 0 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(234, 88, 12, 0.35); mso-hide: all;">
                      Login to ServDesk Portal &rarr;
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size: 12px; color: #94a3b8; line-height: 1.5; padding-bottom: 8px;">
                    🔒 For security, please change your default password after your first login.
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 20px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.6;">
              <p style="margin: 0 0 6px 0; font-weight: 800; color: #0f172a; font-size: 12px;">
                ServDesk &bull; Powered by Alvora Tech Solution
              </p>
              <p style="margin: 0 0 4px 0; color: #475569;">
                Helpline / WhatsApp: <strong style="color: #0f172a;">+91 8385973582</strong>
              </p>
              <p style="margin: 0 0 6px 0; color: #475569;">
                Support Email: <a href="mailto:alvora.tech.solution@gmail.com" style="color: #ea580c; text-decoration: none;">alvora.tech.solution@gmail.com</a>
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 10px;">
                Jaipur, Rajasthan, India &bull; All Rights Reserved
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
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

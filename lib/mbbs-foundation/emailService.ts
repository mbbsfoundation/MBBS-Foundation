import { Resend } from "resend";

/**
 * Transactional Email Service for MBBS Foundation Online Learning Programme.
 *
 * Implements Resend integration with strict security constraints:
 * - Sender address: lms@mbbsfoundation.com (configurable via RESEND_FROM_EMAIL).
 * - Fails closed if RESEND_API_KEY is missing or invalid.
 * - Branded, responsive email with prominent 15-minute validity notice.
 * - Under NO circumstances are verification tokens, magic links, or API keys logged.
 */

export const DEFAULT_SENDER_EMAIL = "MBBS Foundation LMS <lms@mbbsfoundation.com>";
export const DEFAULT_VERIFICATION_EXPIRY_MINUTES = 15;

export interface EmailDeliveryResult {
  success: boolean;
  provider?: string;
  messageId?: string;
  error?: string;
}

export interface LearnerVerificationEmailPayload {
  toEmail: string;
  normalizedEmail: string;
  verificationUrl: string;
  expiresInMinutes?: number;
}

export interface EmailServiceProvider {
  readonly name: string;
  sendVerificationEmail(
    payload: LearnerVerificationEmailPayload
  ): Promise<EmailDeliveryResult>;
}

/**
 * Escapes HTML characters to prevent XSS in email clients.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generates branded HTML template for learner email verification.
 */
export function renderLearnerVerificationHtml(
  payload: LearnerVerificationEmailPayload
): string {
  const expiry = payload.expiresInMinutes || DEFAULT_VERIFICATION_EXPIRY_MINUTES;
  const safeEmail = escapeHtml(payload.toEmail);
  const safeUrl = escapeHtml(payload.verificationUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email for MBBS Foundation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%); padding: 28px 32px; text-align: left;">
              <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.1em; color: #fecaca; text-transform: uppercase;">MBBS FOUNDATION</span>
              <h1 style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: #ffffff; line-height: 1.3;">Online Learning Programme</h1>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #0f172a;">
                Hello,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                We received a sign-in or registration request for the MBBS Foundation Online Learning Programme for your email address (<strong>${safeEmail}</strong>).
              </p>
              <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                Please click the button below to verify your email and access your learning dashboard:
              </p>
              <!-- Action Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 28px auto;">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #991b1b;">
                    <a href="${safeUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px;">
                      Verify Email &amp; Continue &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Expiry Alert -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; line-height: 1.5; color: #991b1b;">
                    <strong>Notice:</strong> This single-use verification link is valid for <strong>${expiry} minutes</strong> and can only be used once.
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">
                If the button above does not work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 24px 0; font-size: 12px; line-height: 1.4; word-break: break-all; color: #991b1b;">
                ${safeUrl}
              </p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <!-- Security Disclaimer -->
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                <strong>Security Notice:</strong> If you did not request this email, please ignore it. No changes have been made to your account.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                MBBS Foundation &bull; Ayurvigyan Foundation
              </p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #cbd5e1;">
                Medical Council of India &amp; NMC Curriculum Aligned
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates plaintext fallback template for learner email verification.
 */
export function renderLearnerVerificationText(
  payload: LearnerVerificationEmailPayload
): string {
  const expiry = payload.expiresInMinutes || DEFAULT_VERIFICATION_EXPIRY_MINUTES;

  return `MBBS Foundation Online Learning Programme
=========================================

Hello,

We received a sign-in or registration request for the MBBS Foundation Online Learning Programme for your email address (${payload.toEmail}).

Please verify your email address by opening the link below:

${payload.verificationUrl}

Notice: This single-use verification link is valid for ${expiry} minutes and can only be used once.

Security Notice: If you did not request this email, you can safely ignore this message. No account changes have been made.

-----------------------------------------
MBBS Foundation • Ayurvigyan Foundation
https://mbbsfoundation.com
`;
}

export interface ResendProviderOptions {
  apiKey?: string;
  fromEmail?: string;
  resendClient?: Resend;
}

/**
 * Resend Email Service Provider Adapter.
 * Dispatches transactional verification emails using Resend API.
 */
export class ResendEmailProvider implements EmailServiceProvider {
  readonly name = "resend";
  private resend: Resend | null = null;
  private fromEmail: string;

  constructor(options?: ResendProviderOptions) {
    const apiKey = (options?.apiKey || process.env.RESEND_API_KEY || "").trim();
    this.fromEmail = (
      options?.fromEmail ||
      process.env.RESEND_FROM_EMAIL ||
      DEFAULT_SENDER_EMAIL
    ).trim();

    if (options?.resendClient) {
      this.resend = options.resendClient;
    } else if (apiKey && !apiKey.toLowerCase().includes("placeholder")) {
      this.resend = new Resend(apiKey);
    }
  }

  async sendVerificationEmail(
    payload: LearnerVerificationEmailPayload
  ): Promise<EmailDeliveryResult> {
    // 1. Strict validation: require API key & client (Fail closed)
    if (!this.resend) {
      return {
        success: false,
        provider: this.name,
        error:
          "RESEND_API_KEY is missing or unconfigured. Transactional email dispatch failed closed.",
      };
    }

    // 2. Validate sender address
    if (!this.fromEmail || !this.fromEmail.includes("@")) {
      return {
        success: false,
        provider: this.name,
        error: "RESEND_FROM_EMAIL sender address is invalid.",
      };
    }

    // 3. Render branded templates
    const emailHtml = renderLearnerVerificationHtml(payload);
    const emailText = renderLearnerVerificationText(payload);

    try {
      const response = await this.resend.emails.send({
        from: this.fromEmail,
        to: [payload.toEmail],
        subject: "Verify your email for MBBS Foundation Online Learning",
        html: emailHtml,
        text: emailText,
      });

      if (response.error) {
        return {
          success: false,
          provider: this.name,
          error: `Resend API Error: ${response.error.name} - ${response.error.message}`,
        };
      }

      return {
        success: true,
        provider: this.name,
        messageId: response.data?.id,
      };
    } catch (err: any) {
      // Never log tokens or links
      return {
        success: false,
        provider: this.name,
        error: err?.message || "RESEND_TRANSACTION_ERROR",
      };
    }
  }
}

/**
 * Null / Unconfigured Provider (Default when no provider is active).
 * Fails closed without exposing secrets or links.
 */
export class UnconfiguredEmailProvider implements EmailServiceProvider {
  readonly name = "unconfigured";

  async sendVerificationEmail(
    payload: LearnerVerificationEmailPayload
  ): Promise<EmailDeliveryResult> {
    if (process.env.NODE_ENV === "production") {
      return {
        success: false,
        provider: this.name,
        error:
          "TRANSACTIONAL_EMAIL_NOT_CONFIGURED: Production email dispatch is disabled until a transactional provider is provisioned.",
      };
    }

    return {
      success: false,
      provider: this.name,
      error: `EMAIL_PROVIDER_UNCONFIGURED: Email dispatch for [${payload.normalizedEmail}] blocked (Provider not configured).`,
    };
  }
}

let registeredEmailProvider: EmailServiceProvider | null = null;

/**
 * Registers an explicit transactional email provider (e.g. for testing or custom setup).
 */
export function registerEmailProvider(provider: EmailServiceProvider): void {
  registeredEmailProvider = provider;
}

/**
 * Clears explicitly registered provider, resetting to auto-resolution.
 */
export function clearRegisteredEmailProvider(): void {
  registeredEmailProvider = null;
}

/**
 * Resolves the active email service provider.
 * Priority:
 * 1. Explicitly registered provider (e.g. mock test provider).
 * 2. Resend provider if RESEND_API_KEY is configured.
 * 3. Unconfigured provider (fails closed).
 */
export function getActiveEmailProvider(): EmailServiceProvider {
  if (registeredEmailProvider) {
    return registeredEmailProvider;
  }

  const resendApiKey = (process.env.RESEND_API_KEY || "").trim();
  if (resendApiKey && !resendApiKey.toLowerCase().includes("placeholder")) {
    return new ResendEmailProvider({ apiKey: resendApiKey });
  }

  return new UnconfiguredEmailProvider();
}

/**
 * Returns the currently active email service provider name.
 */
export function getActiveEmailProviderName(): string {
  return getActiveEmailProvider().name;
}

/**
 * Dispatches a learner verification email through the active provider.
 * Under NO circumstances are verificationUrl or raw tokens logged.
 */
export async function sendLearnerVerificationEmail(
  payload: LearnerVerificationEmailPayload
): Promise<EmailDeliveryResult> {
  const provider = getActiveEmailProvider();
  try {
    return await provider.sendVerificationEmail(payload);
  } catch (error: any) {
    return {
      success: false,
      provider: provider.name,
      error: error?.message || "UNKNOWN_EMAIL_DISPATCH_ERROR",
    };
  }
}

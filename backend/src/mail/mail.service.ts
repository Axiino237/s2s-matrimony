import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('MAIL_HOST', 'smtp.gmail.com'),
      port: this.config.get<number>('MAIL_PORT', 587),
      secure: false, // Use STARTTLS
      auth: {
        user: this.config.get<string>('MAIL_USER'),
        pass: this.config.get<string>('MAIL_PASS'),
      },
    });

    // Verify connection on startup
    this.transporter.verify((error) => {
      if (error) {
        this.logger.error(`Mail transporter error: ${error.message}`);
      } else {
        this.logger.log('✅ Gmail SMTP connected successfully');
      }
    });
  }

  /** Send OTP email (phone verification) */
  async sendOtpEmail(to: string, otp: string, name?: string): Promise<void> {
    const from = this.config.get<string>('MAIL_FROM', 'S2S Matrimony <axiino237@gmail.com>');
    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: `Your S2S Matrimony OTP: ${otp}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #fff; border-radius: 12px; border: 1px solid #e5e7eb;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #7C3AED; font-size: 24px; margin: 0;">S2S Matrimony</h2>
              <p style="color: #6B7280; font-size: 14px; margin-top: 4px;">Your One-Time Password</p>
            </div>
            <p style="color: #374151; font-size: 15px;">Hello${name ? ` ${name}` : ''},</p>
            <p style="color: #374151; font-size: 15px;">Use the OTP below to verify your account. It is valid for <strong>5 minutes</strong>.</p>
            <div style="text-align: center; margin: 28px 0;">
              <span style="display: inline-block; background: #F3F0FF; border: 2px dashed #7C3AED; color: #7C3AED; font-size: 36px; font-weight: bold; letter-spacing: 10px; padding: 16px 28px; border-radius: 12px;">
                ${otp}
              </span>
            </div>
            <p style="color: #9CA3AF; font-size: 13px; text-align: center;">If you did not request this OTP, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
            <p style="color: #D1D5DB; font-size: 11px; text-align: center;">© ${new Date().getFullYear()} S2S Matrimony. All rights reserved.</p>
          </div>
        `,
      });
      this.logger.log(`✅ OTP email sent to ${to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send OTP email to ${to}: ${error.message}`);
      // Don't throw — OTP is still valid in DB (dev mode fallback)
    }
  }

  /** Send welcome email after registration */
  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const from = this.config.get<string>('MAIL_FROM', 'S2S Matrimony <axiino237@gmail.com>');
    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: 'Welcome to S2S Matrimony! 🎉',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #fff; border-radius: 12px; border: 1px solid #e5e7eb;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #7C3AED; font-size: 24px; margin: 0;">Welcome to S2S Matrimony!</h2>
            </div>
            <p style="color: #374151; font-size: 15px;">Dear ${name},</p>
            <p style="color: #374151; font-size: 15px;">
              Your account has been successfully created. Start exploring thousands of verified profiles across 200+ South Indian communities.
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="http://localhost:5173/dashboard" style="display: inline-block; background: #7C3AED; color: #fff; font-size: 15px; font-weight: bold; padding: 14px 32px; border-radius: 8px; text-decoration: none;">
                View Your Dashboard →
              </a>
            </div>
            <p style="color: #9CA3AF; font-size: 13px; text-align: center;">Start finding your perfect partner today.</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
            <p style="color: #D1D5DB; font-size: 11px; text-align: center;">© ${new Date().getFullYear()} S2S Matrimony. All rights reserved.</p>
          </div>
        `,
      });
      this.logger.log(`✅ Welcome email sent to ${to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send welcome email to ${to}: ${error.message}`);
    }
  }

  /** Send password reset email with secure link (legacy, kept for reference) */
  async sendPasswordResetEmail(to: string, resetLink: string, name?: string): Promise<void> {
    const from = this.config.get<string>('MAIL_FROM', 'S2S Matrimony <axiino237@gmail.com>');
    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: 'Reset Your S2S Matrimony Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #fff; border-radius: 12px; border: 1px solid #e5e7eb;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #7C3AED; font-size: 24px; margin: 0;">S2S Matrimony</h2>
              <p style="color: #6B7280; font-size: 14px; margin-top: 4px;">Password Reset Request</p>
            </div>
            <p style="color: #374151; font-size: 15px;">Hello${name ? ` ${name}` : ''},</p>
            <p style="color: #374151; font-size: 15px;">
              We received a request to reset your password. Click the button below to set a new password.
              This link is valid for <strong>15 minutes</strong>.
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetLink}" style="display: inline-block; background: #7C3AED; color: #fff; font-size: 15px; font-weight: bold; padding: 14px 32px; border-radius: 8px; text-decoration: none;">
                Reset My Password →
              </a>
            </div>
            <p style="color: #9CA3AF; font-size: 13px;">Or copy this link into your browser:</p>
            <p style="background: #F3F4F6; padding: 10px 14px; border-radius: 6px; font-size: 12px; word-break: break-all; color: #4B5563;">${resetLink}</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
            <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
              ⚠ If you did not request this, please ignore this email. Your password will not change.
            </p>
            <p style="color: #D1D5DB; font-size: 11px; text-align: center;">© ${new Date().getFullYear()} S2S Matrimony. All rights reserved.</p>
          </div>
        `,
      });
      this.logger.log(`✅ Password reset email sent to ${to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send password reset email to ${to}: ${error.message}`);
      throw new Error('Failed to send reset email. Please try again.');
    }
  }

  /** Send forgot-password OTP email */
  async sendForgotPasswordOtp(to: string, otp: string, name?: string): Promise<void> {
    const from = this.config.get<string>('MAIL_FROM', 'S2S Matrimony <axiino237@gmail.com>');
    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: `Your S2S Matrimony Password Reset OTP: ${otp}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #fff; border-radius: 12px; border: 1px solid #e5e7eb;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #7C3AED; font-size: 24px; margin: 0;">S2S Matrimony</h2>
              <p style="color: #6B7280; font-size: 14px; margin-top: 4px;">Password Reset OTP</p>
            </div>
            <p style="color: #374151; font-size: 15px;">Hello${name ? ` ${name}` : ''},</p>
            <p style="color: #374151; font-size: 15px;">
              Use the OTP below to reset your password. It is valid for <strong>10 minutes</strong>.
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <span style="display: inline-block; background: #F3F0FF; border: 2px dashed #7C3AED; color: #7C3AED; font-size: 36px; font-weight: bold; letter-spacing: 10px; padding: 16px 28px; border-radius: 12px;">
                ${otp}
              </span>
            </div>
            <p style="color: #9CA3AF; font-size: 13px; text-align: center;">Do NOT share this OTP with anyone. S2S Matrimony will never ask for your OTP.</p>
            <p style="color: #9CA3AF; font-size: 13px; text-align: center;">If you did not request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
            <p style="color: #D1D5DB; font-size: 11px; text-align: center;">© ${new Date().getFullYear()} S2S Matrimony. All rights reserved.</p>
          </div>
        `,
      });
      this.logger.log(`✅ Forgot-password OTP email sent to ${to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send forgot-password OTP email to ${to}: ${error.message}`);
      throw new Error('Failed to send OTP email. Please try again.');
    }
  }
}

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly client?: twilio.Twilio;
  private readonly verifySid?: string;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.verifySid = this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID');

    if (accountSid && authToken && this.verifySid) {
      this.client = twilio(accountSid, authToken);
    } else if (this.isProduction) {
      throw new Error('Twilio Verify configuration is required in production');
    }
  }

  private get isProduction() {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  private get allowDevOtp() {
    return !this.isProduction && this.configService.get<string>('ALLOW_DEV_OTP', 'true') === 'true';
  }

  private formatPhone(phone: string): string {
    const cleaned = (phone || '').replace(/\D/g, '');
    if (cleaned.length === 10) return `+91${cleaned}`;
    if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`;
    if (phone.trim().startsWith('+')) return `+${cleaned}`;
    if (cleaned.length > 10) return `+${cleaned}`;
    return `+91${cleaned.slice(-10)}`;
  }

  /**
   * Sends a 6-digit OTP via Twilio Verify SMS.
   * Twilio manages OTP generation, delivery, expiry, and rate-limiting.
   */
  async sendOtp(phone: string): Promise<{ success: boolean; message: string; otp?: string }> {
    const targetPhone = this.formatPhone(phone);
    if (!this.client || !this.verifySid) {
      if (!this.allowDevOtp) {
        throw new BadRequestException('OTP service is not configured');
      }
      this.logger.warn(`[OTP] Twilio is not configured for ${targetPhone}. Using Dev OTP 123456.`);
      return {
        success: true,
        message: `OTP sent to ${targetPhone} (Dev OTP: 123456)`,
        ...(this.isProduction ? {} : { otp: '123456' }),
      };
    }

    try {
      const verification = await this.client.verify.v2
        .services(this.verifySid)
        .verifications.create({ to: targetPhone, channel: 'sms' });

      this.logger.log(`[OTP] Twilio Verify sent to ${targetPhone} | status: ${verification.status}`);
      return {
        success: true,
        message: `OTP sent to ${targetPhone}`,
        ...(this.isProduction ? {} : { otp: '123456' }),
      };
    } catch (error: any) {
      if (!this.allowDevOtp) {
        throw new BadRequestException('Unable to send OTP. Please try again.');
      }

      this.logger.warn(`[OTP] Twilio Verify failed for ${targetPhone} (${error?.message}). Using Dev OTP 123456.`);
      return {
        success: true,
        message: `OTP sent to ${targetPhone} (Dev OTP: 123456)`,
        ...(this.isProduction ? {} : { otp: '123456' }),
      };
    }
  }

  /**
   * Verifies the OTP entered by the user against Twilio Verify.
   * Throws BadRequestException if the code is wrong or expired.
   */
  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const targetPhone = this.formatPhone(phone);
    if (this.allowDevOtp && otp === '123456') {
      this.logger.log(`[OTP] Verified using Dev OTP (123456) for ${targetPhone}`);
      return true;
    }

    if (!this.client || !this.verifySid) {
      throw new BadRequestException('OTP service is not configured');
    }

    try {
      const check = await this.client.verify.v2
        .services(this.verifySid)
        .verificationChecks.create({ to: targetPhone, code: otp });

      if (check.status !== 'approved') {
        throw new BadRequestException('Invalid or expired OTP code.');
      }

      this.logger.log(`[OTP] Verified successfully for ${targetPhone}`);
      return true;
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;

      this.logger.warn(`[OTP] Twilio Verification check failed for ${targetPhone} (${error?.message}).`);
      throw new BadRequestException('Invalid or expired OTP code.');
    }
  }
}

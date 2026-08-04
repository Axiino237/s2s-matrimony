import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly client?: ReturnType<typeof Twilio>;
  private readonly verifySid?: string;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.verifySid = this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID');

    if (accountSid && authToken && this.verifySid) {
      this.client = Twilio(accountSid, authToken);
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

  /**
   * Sends a 6-digit OTP via Twilio Verify SMS.
   * Twilio manages OTP generation, delivery, expiry, and rate-limiting.
   */
  async sendOtp(phone: string): Promise<{ success: boolean; message: string }> {
    if (!this.client || !this.verifySid) {
      if (!this.allowDevOtp) {
        throw new BadRequestException('OTP service is not configured');
      }
      this.logger.warn(`[OTP] Twilio is not configured for ${phone}. Using Dev OTP 123456.`);
      return { success: true, message: `OTP sent to ${phone} (Dev OTP: 123456)` };
    }

    try {
      const verification = await this.client.verify.v2
        .services(this.verifySid)
        .verifications.create({ to: phone, channel: 'sms' });

      this.logger.log(`[OTP] Twilio Verify sent to ${phone} | status: ${verification.status}`);
      return { success: true, message: `OTP sent to ${phone}` };
    } catch (error: any) {
      if (!this.allowDevOtp) {
        throw new BadRequestException('Unable to send OTP. Please try again.');
      }

      this.logger.warn(`[OTP] Twilio Verify failed for ${phone} (${error?.message}). Using Dev OTP 123456.`);
      return { success: true, message: `OTP sent to ${phone} (Dev OTP: 123456)` };
    }
  }

  /**
   * Verifies the OTP entered by the user against Twilio Verify.
   * Throws BadRequestException if the code is wrong or expired.
   */
  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    if (this.allowDevOtp && otp === '123456') {
      this.logger.log(`[OTP] Verified using Dev OTP (123456) for ${phone}`);
      return true;
    }

    if (!this.client || !this.verifySid) {
      throw new BadRequestException('OTP service is not configured');
    }

    try {
      const check = await this.client.verify.v2
        .services(this.verifySid)
        .verificationChecks.create({ to: phone, code: otp });

      if (check.status !== 'approved') {
        throw new BadRequestException('Invalid or expired OTP code.');
      }

      this.logger.log(`[OTP] Verified successfully for ${phone}`);
      return true;
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;

      this.logger.warn(`[OTP] Twilio Verification check failed for ${phone} (${error?.message}).`);
      throw new BadRequestException('Invalid or expired OTP code.');
    }
  }
}

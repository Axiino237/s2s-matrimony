import { IsString, IsNotEmpty, IsEmail, IsOptional, MinLength, Matches } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' })
  phone: string;
}

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  otp: string;
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  // ── Personal Info ──
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  profileFor?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  maritalStatus?: string; // NEVER_MARRIED | DIVORCED | WIDOWED | SEPARATED

  @IsString()
  @IsOptional()
  motherTongue?: string; // Tamil | Telugu | Kannada | Hindi | etc.

  @IsOptional()
  heightCm?: number; // height in cm

  // ── Community & Religion ──
  @IsString()
  @IsOptional()
  religion?: string; // Hindu | Christian | Muslim | Others

  @IsString()
  @IsOptional()
  community?: string; // Nadar | Mudaliar | Gounder | etc.

  @IsString()
  @IsOptional()
  subCaste?: string;

  // ── About ──
  @IsString()
  @IsOptional()
  about?: string;
}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

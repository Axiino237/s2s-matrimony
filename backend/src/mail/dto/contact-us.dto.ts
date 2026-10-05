import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContactUsDto {
  @ApiProperty({ example: 'Ravi Kumar', description: 'Name of the person submitting the inquiry' })
  @IsString()
  @IsNotEmpty({ message: 'Your name is required' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name: string;

  @ApiProperty({ example: 'ravi.kumar@example.com', description: 'Email address of the sender' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  @MaxLength(150, { message: 'Email cannot exceed 150 characters' })
  email: string;

  @ApiPropertyOptional({ example: '+91 98765 43210', description: 'Phone or mobile number' })
  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'Phone number cannot exceed 30 characters' })
  phone?: string;

  @ApiPropertyOptional({ example: 'Horoscope Matching Inquiry', description: 'Subject or purpose of the message' })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Subject cannot exceed 200 characters' })
  subject?: string;

  @ApiProperty({ example: 'Hello, I would like to know how the AI Porutham matching works.', description: 'Message content' })
  @IsString()
  @IsNotEmpty({ message: 'Message content is required' })
  @MaxLength(5000, { message: 'Message cannot exceed 5000 characters' })
  message: string;
}

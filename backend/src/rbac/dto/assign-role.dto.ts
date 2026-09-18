import { IsUUID, IsOptional, IsString, IsDateString, IsBoolean } from 'class-validator';

export class AssignRoleDto {
  @IsUUID()
  roleId: string;

  @IsOptional()
  @IsUUID()
  communityId?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

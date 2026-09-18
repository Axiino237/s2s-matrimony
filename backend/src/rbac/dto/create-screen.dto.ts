import { IsString, IsOptional, IsBoolean, IsInt, IsUUID } from 'class-validator';

export class CreateScreenDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  route: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

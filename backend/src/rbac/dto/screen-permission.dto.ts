import { IsUUID } from 'class-validator';

export class AssignScreenPermissionDto {
  @IsUUID()
  permissionId: string;
}

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCREEN_KEY } from '../decorators/screen.decorator';
import { IS_PUBLIC_KEY } from '../decorators/rbac.decorator';
import { RbacService } from '../../rbac/rbac.service';

@Injectable()
export class ScreenAccessGuard implements CanActivate {
  constructor(private reflector: Reflector, private rbacService: RbacService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredScreen = this.reflector.getAllAndOverride<string>(SCREEN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredScreen) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Authentication required');

    const canAccess = await this.rbacService.canUserAccessScreen(user.id, requiredScreen);
    if (!canAccess) {
      throw new ForbiddenException(`Access denied to screen: ${requiredScreen}`);
    }

    return true;
  }
}

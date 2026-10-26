import { Injectable, CanActivate, ExecutionContext, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { checkIsMaintenanceModeActive } from '../maintenance.util';

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isMaintenance = await checkIsMaintenanceModeActive(this.prisma);
    if (!isMaintenance) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const url = (request.originalUrl || request.url || '').toLowerCase();

    // 1. Unconditional bypass: health checks & Swagger docs
    if (
      url === '/' ||
      url === '/api/v1' ||
      url === '/api/v1/' ||
      url.startsWith('/api/docs')
    ) {
      return true;
    }

    // 2. Public settings & static pages MUST remain accessible so frontend can monitor maintenance state
    if (
      url.startsWith('/api/v1/settings/public') ||
      url.startsWith('/api/v1/static-pages/public')
    ) {
      return true;
    }

    // 3. Administration endpoints MUST remain accessible so Admins can manage the platform and toggle maintenance
    if (
      url.startsWith('/api/v1/admin') ||
      url.startsWith('/api/v1/super-admin')
    ) {
      return true;
    }

    // 4. Essential Auth endpoints needed for Admin login and active session handling
    // Login and OTP verification handlers inspect credentials and allow staff while blocking members
    if (
      url.startsWith('/api/v1/auth/admin-login') ||
      url.startsWith('/api/v1/auth/login') ||
      url.startsWith('/api/v1/auth/verify-otp') ||
      url.startsWith('/api/v1/auth/logout')
    ) {
      return true;
    }

    // 5. For any other endpoints (including /auth/me, /auth/refresh, profiles, etc.), allow if user is an authenticated Admin or Super Admin
    const user = request.user;
    let userRole = (user?.role || user?.roles?.[0] || user?.userRoles?.[0]?.role?.name)?.toString().toUpperCase();

    // If user is not yet on request, check Authorization Bearer token
    if (!userRole && request.headers?.authorization?.startsWith('Bearer ')) {
      try {
        const token = request.headers.authorization.split(' ')[1];
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        userRole = (payload?.role || payload?.roles?.[0])?.toString().toUpperCase();
      } catch {}
    }

    // Also check refresh token cookie/body for /auth/refresh
    if (!userRole && url.startsWith('/api/v1/auth/refresh')) {
      try {
        const refreshToken = request.cookies?.s2s_refresh_token || request.body?.refreshToken;
        if (refreshToken) {
          const payload = JSON.parse(Buffer.from(refreshToken.split('.')[1], 'base64').toString());
          userRole = (payload?.role || payload?.roles?.[0])?.toString().toUpperCase();
        }
      } catch {}
    }

    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      return true;
    }

    // 6. Non-admin users are blocked with HTTP 503
    throw new ServiceUnavailableException({
      statusCode: 503,
      error: 'Service Unavailable',
      message: 'The platform is currently undergoing scheduled maintenance. Please check back soon.',
      maintenance: true,
    });
  }
}

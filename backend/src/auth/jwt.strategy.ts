import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  phone: string;
  roles: string[];
  permissions: string[];
  membershipTier: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'super-secret-jwt-key-s2s-matrimony'),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub) throw new UnauthorizedException('Invalid token payload');
    return {
      sub: payload.sub,
      id: payload.sub,
      email: payload.email,
      phone: payload.phone,
      roles: payload.roles || ['MEMBER'],
      permissions: payload.permissions || [],
      membershipTier: payload.membershipTier || 'FREE',
    };
  }
}

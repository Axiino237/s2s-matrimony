---
name: matrimony-auth
description: Authentication patterns including JWT, OTP, refresh tokens, and session management for S2S Community Matrimony. Use this skill when implementing any auth-related features on frontend or backend.
---

# S2S Matrimony — Authentication Skill

## Auth Flow Overview

```
Registration:
Phone → Send OTP → Verify OTP → Fill Profile Steps → Active Account

Login Options:
1. Phone + OTP (primary)
2. Email + Password (secondary)
3. Social (future)

Token Strategy:
- Access Token: 15 minutes (stored in memory)
- Refresh Token: 30 days (stored in httpOnly cookie)
- OTP: 5 minutes expiry, 6 digits
```

## Backend Auth Module Structure

```
src/auth/
├── dto/
│   ├── register.dto.ts
│   ├── login.dto.ts
│   ├── verify-otp.dto.ts
│   └── refresh-token.dto.ts
├── strategies/
│   ├── jwt.strategy.ts
│   └── jwt-refresh.strategy.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   └── jwt-refresh.guard.ts
├── auth.controller.ts
├── auth.service.ts
├── auth.module.ts
└── otp.service.ts
```

## JWT Strategy

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    // Load fresh permissions from DB/Cache on each request
    return {
      sub: payload.sub,
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions,
      membershipStatus: payload.membershipStatus,
    };
  }
}
```

## OTP Service

```typescript
@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsService,
  ) {}

  async sendOtp(phone: string): Promise<void> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await this.prisma.otpToken.upsert({
      where: { phone },
      update: { otp, expiresAt, attempts: 0 },
      create: { phone, otp, expiresAt },
    });

    await this.smsService.send(phone, `Your S2S Matrimony OTP is ${otp}. Valid for 5 minutes.`);
  }

  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const record = await this.prisma.otpToken.findUnique({ where: { phone } });
    if (!record || record.expiresAt < new Date()) throw new BadRequestException('OTP expired');
    if (record.attempts >= 3) throw new BadRequestException('Too many attempts');
    if (record.otp !== otp) {
      await this.prisma.otpToken.update({ where: { phone }, data: { attempts: { increment: 1 } } });
      throw new BadRequestException('Invalid OTP');
    }
    await this.prisma.otpToken.delete({ where: { phone } });
    return true;
  }
}
```

## Auth Controller Endpoints

```
POST /api/v1/auth/send-otp          → Send OTP to phone
POST /api/v1/auth/verify-otp        → Verify OTP, get tokens
POST /api/v1/auth/register          → Register new user
POST /api/v1/auth/login             → Email + password login
POST /api/v1/auth/refresh           → Refresh access token
POST /api/v1/auth/logout            → Invalidate refresh token
POST /api/v1/auth/forgot-password   → Send reset email
POST /api/v1/auth/reset-password    → Reset with token
GET  /api/v1/auth/me                → Get current user (protected)
POST /api/v1/auth/verify-email      → Verify email address
```

## Frontend Auth Store (Zustand)

```typescript
interface AuthState {
  user: JwtPayload | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (credentials: LoginDto) => Promise<void>;
  loginWithOtp: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setUser: (user: JwtPayload) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const res = await authApi.login(credentials);
          set({ user: res.user, accessToken: res.accessToken, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        await authApi.logout();
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
    }),
    { name: 's2s-auth', partialize: (state) => ({ user: state.user }) }
  )
);
```

## Axios Interceptor (Token Refresh)

```typescript
// services/api.ts
axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
        useAuthStore.getState().setAccessToken(res.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return axiosInstance(originalRequest);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

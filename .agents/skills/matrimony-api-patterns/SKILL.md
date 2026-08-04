---
name: matrimony-api-patterns
description: NestJS API module patterns, DTOs, service patterns, and REST conventions for S2S Community Matrimony. Use this skill when creating any backend NestJS module, controller, service, or DTO.
---

# S2S Matrimony — NestJS API Patterns Skill

## Module Structure Convention

Every NestJS module follows this structure:
```
src/[module-name]/
├── dto/
│   ├── create-[entity].dto.ts
│   ├── update-[entity].dto.ts
│   └── filter-[entity].dto.ts
├── [module-name].controller.ts
├── [module-name].service.ts
├── [module-name].module.ts
└── [module-name].types.ts
```

## Controller Pattern

```typescript
@Controller('api/v1/[resource]')
@UseGuards(JwtAuthGuard)
@ApiTags('[Resource]')
@ApiBearerAuth()
export class ResourceController {
  constructor(private readonly service: ResourceService) {}

  @Get()
  @ApiOperation({ summary: 'List all' })
  @ApiResponse({ status: 200, type: [ResourceDto] })
  findAll(@Query() query: FilterDto, @CurrentUser() user: JwtPayload) {
    return this.service.findAll(query, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.sub);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
```

## Service Pattern

```typescript
@Injectable()
export class ResourceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(filter: FilterDto, user: JwtPayload) {
    const { page = 1, limit = 20, ...where } = filter;
    const [data, total] = await Promise.all([
      this.prisma.resource.findMany({
        where: this.buildWhere(where),
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.resource.count({ where: this.buildWhere(where) }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOneOrThrow(id: string) {
    const item = await this.prisma.resource.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Resource ${id} not found`);
    return item;
  }

  async create(dto: CreateDto, userId: string) {
    const item = await this.prisma.resource.create({ data: { ...dto, userId } });
    await this.auditService.log({ userId, action: 'CREATE', entity: 'Resource', entityId: item.id });
    return item;
  }
}
```

## DTO Pattern (with validation)

```typescript
export class CreateProfileDto {
  @IsString() @IsNotEmpty()
  @ApiProperty({ example: 'John' })
  firstName: string;

  @IsString() @IsNotEmpty()
  lastName: string;

  @IsDateString()
  dateOfBirth: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsUUID()
  communityId: string;

  @IsOptional() @IsString()
  about?: string;

  @IsNumber() @Min(100) @Max(250)
  heightCm: number;
}
```

## Standard API Response Format

```typescript
// Success
{ data: {...}, message: 'Success', statusCode: 200 }

// Paginated
{ data: [...], meta: { page, limit, total, totalPages }, statusCode: 200 }

// Error
{ message: 'Not found', error: 'Not Found', statusCode: 404 }
```

## Response Interceptor

```typescript
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => ({
        statusCode: context.switchToHttp().getResponse().statusCode,
        data,
        timestamp: new Date().toISOString(),
      }))
    );
  }
}
```

## Current User Decorator

```typescript
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return data ? user?.[data] : user;
  },
);
```

## API Versioning Convention

All routes prefixed with `/api/v1/`:
- Public: `/api/v1/public/...`
- Auth: `/api/v1/auth/...`
- Member: `/api/v1/profiles/...`, `/api/v1/search/...`
- Admin: `/api/v1/admin/...`
- Super Admin: `/api/v1/super-admin/...`

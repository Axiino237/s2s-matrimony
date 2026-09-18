import { SetMetadata } from '@nestjs/common';

export const SCREEN_KEY = 'required_screen';

/** Decorator to mark which screen slug is required to access this endpoint */
export const RequireScreen = (screenSlug: string) => SetMetadata(SCREEN_KEY, screenSlug);

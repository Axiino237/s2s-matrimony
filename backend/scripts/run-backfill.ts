import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { HoroscopeMatchingService } from '../src/profiles/horoscope-matching.service';

async function bootstrap() {
  console.log('Initializing NestJS application context for one-time Horoscope Backfill...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const horoscopeService = app.get(HoroscopeMatchingService);

  console.log('Running backfillAllEligible()...');
  const result = await horoscopeService.backfillAllEligible();
  console.log('Backfill complete! Result:', result);

  await app.close();
}

bootstrap().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});

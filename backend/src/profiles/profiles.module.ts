import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { BiodataParserService } from './biodata-parser.service';
import { HoroscopeMatchingService } from './horoscope-matching.service';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [AuthModule, MailModule],
  controllers: [ProfilesController],
  providers: [ProfilesService, BiodataParserService, HoroscopeMatchingService],
  exports: [ProfilesService, BiodataParserService, HoroscopeMatchingService],
})
export class ProfilesModule {}

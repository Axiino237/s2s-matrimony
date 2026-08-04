import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { BiodataParserService } from './biodata-parser.service';

@Module({
  controllers: [ProfilesController],
  providers: [ProfilesService, BiodataParserService],
  exports: [ProfilesService, BiodataParserService],
})
export class ProfilesModule {}

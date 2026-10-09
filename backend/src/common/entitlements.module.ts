import { Global, Module } from '@nestjs/common';
import { EntitlementsService } from './entitlements.service';
import { EliteQualificationService } from './elite-qualification.service';

@Global()
@Module({
  providers: [EntitlementsService, EliteQualificationService],
  exports: [EntitlementsService, EliteQualificationService],
})
export class EntitlementsModule {}

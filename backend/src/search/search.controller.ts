import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { Public } from '../common/decorators/rbac.decorator';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get('locations/countries')
  @ApiOperation({ summary: 'Get all active countries' })
  async getCountries() {
    return this.searchService.getCountries();
  }

  @Public()
  @Get('locations/states')
  @ApiOperation({ summary: 'Get states for a country' })
  async getStates(@Query('country') country?: string, @Query('countryId') countryId?: string) {
    return this.searchService.getStates(countryId || country);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search profiles by age, gender, community, location, etc.' })
  async search(@Query() query: any, @Req() req?: any) {
    if (!query.excludeUserId && !query.userId) {
      const auth = req?.headers?.authorization;
      if (auth && auth.startsWith('Bearer ')) {
        try {
          const parts = auth.split(' ')[1].split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            query.excludeUserId = payload.sub || payload.id;
          }
        } catch {
          // ignore
        }
      }
    }
    return this.searchService.searchProfiles(query);
  }
}


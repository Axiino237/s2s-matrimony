import { Controller, Get, Query } from '@nestjs/common';
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
  async search(@Query() query: any) {
    return this.searchService.searchProfiles(query);
  }
}


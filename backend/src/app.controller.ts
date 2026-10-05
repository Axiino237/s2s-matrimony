import { Controller, Get, Post, Body, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppService } from './app.service';
import { MailService } from './mail/mail.service';
import { Public } from './common/decorators/rbac.decorator';
import { ContactUsDto } from './mail/dto/contact-us.dto';

@ApiTags('General')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mailService: MailService,
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('settings/public')
  @ApiOperation({ summary: 'Get public system and social settings' })
  async getPublicSettings() {
    return this.appService.getPublicSettings();
  }

  @Public()
  @Get('static-pages/public')
  @ApiOperation({ summary: 'Get public static pages content (Contact Us, About Us, etc.)' })
  async getPublicStaticPages() {
    return this.appService.getPublicStaticPages();
  }

  @Public()
  @Post('contact')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit Contact Us message and deliver to admin inbox' })
  async submitContact(@Body() dto: ContactUsDto) {
    return this.mailService.sendContactUsEmail(dto);
  }
}

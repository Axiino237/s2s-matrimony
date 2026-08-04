import { Controller, Get, Post, Put, Delete, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { Public } from '../common/decorators/rbac.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DevPlan } from '../common/dev-store';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'List active membership plans' })
  async getPlans() {
    return this.paymentsService.getPlans();
  }

  @UseGuards(JwtAuthGuard)
  @Post('plans')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new membership plan' })
  async createPlan(@Body() body: any) {
    return this.paymentsService.createPlan(body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('plans/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update plan parameters (Super Admin)' })
  async updatePlan(@Param('id') planId: string, @Body() body: any) {
    return this.paymentsService.updatePlan(planId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('plans/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle plan active status' })
  async togglePlanActive(@Param('id') planId: string, @Body() body: { isActive?: boolean }) {
    return this.paymentsService.togglePlanActive(planId, body.isActive);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('plans/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete membership plan' })
  async deletePlan(@Param('id') planId: string) {
    return this.paymentsService.deletePlan(planId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('contacts/unlocked')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user contact unlock status & limits' })
  async getUnlockedContacts(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.paymentsService.getUnlockedContacts(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('contacts/unlock/:targetUserId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlock target candidate contact details enforcing plan limit' })
  async unlockContact(@Req() req: any, @Param('targetUserId') targetUserId: string) {
    const userId = req.user.sub || req.user.id;
    return this.paymentsService.unlockContact(userId, targetUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-order')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Razorpay payment order for plan' })
  async createOrder(@Req() req: any, @Body() body: { planId: string }) {
    const userId = req.user.sub || req.user.id;
    return this.paymentsService.createRazorpayOrder(userId, body.planId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify Razorpay payment signature and activate membership' })
  async verifyPayment(
    @Req() req: any,
    @Body() body: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string },
  ) {
    const userId = req.user.sub || req.user.id;
    return this.paymentsService.verifyPayment(userId, body);
  }
}

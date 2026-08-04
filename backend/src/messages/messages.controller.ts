import { Controller, Get, Post, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';

@ApiTags('Messages')
@Controller('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly messagesGateway: MessagesGateway,
  ) {}

  @Get('chats')
  @ApiOperation({ summary: 'Get all chats for the logged-in user' })
  async getChats(@Request() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.messagesService.getChats(userId);
  }

  @Post('chats/start/:userId')
  @ApiOperation({ summary: 'Start a new chat with another user' })
  async startChat(@Request() req: any, @Param('userId') otherUserId: string) {
    const userId = req.user.sub || req.user.id;
    return this.messagesService.startChat(userId, otherUserId);
  }

  @Get('chats/:chatId')
  @ApiOperation({ summary: 'Get messages inside a chat' })
  async getMessages(
    @Request() req: any,
    @Param('chatId') chatId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const userId = req.user.sub || req.user.id;
    return this.messagesService.getMessages(userId, chatId, page, limit);
  }

  @Post('chats/:chatId')
  @ApiOperation({ summary: 'Send a message in a chat' })
  async sendMessage(
    @Request() req: any,
    @Param('chatId') chatId: string,
    @Body() body: { content: string },
  ) {
    const userId = req.user.sub || req.user.id;
    const message = await this.messagesService.sendMessage(userId, chatId, body.content);

    // Live WebSocket emission to room
    this.messagesGateway.emitLiveMessage(chatId, {
      id: message.id,
      chatId,
      senderId: userId,
      content: body.content,
      createdAt: message.createdAt || new Date().toISOString(),
      type: 'TEXT',
      isRead: false,
    });

    return message;
  }
}

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly messagesService: MessagesService) {}

  handleConnection(client: Socket) {
    console.log(`⚡ WebSocket client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`⚡ WebSocket client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_chat')
  handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    if (data?.chatId) {
      client.join(data.chatId);
      console.log(`📢 Client ${client.id} joined room ${data.chatId}`);
    }
  }

  @SubscribeMessage('leave_chat')
  handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    if (data?.chatId) {
      client.leave(data.chatId);
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; chatId: string; content: string },
  ) {
    if (!data?.chatId || !data?.content || !data?.userId) return;

    const message = await this.messagesService.sendMessage(
      data.userId,
      data.chatId,
      data.content,
    );

    const eventPayload = {
      id: message.id,
      chatId: data.chatId,
      senderId: data.userId,
      content: data.content,
      createdAt: message.createdAt || new Date().toISOString(),
      type: 'TEXT',
      isRead: false,
    };

    // Broadcast live message to all connected clients listening in chatId room
    this.server.to(data.chatId).emit('receive_message', eventPayload);
    this.server.emit('receive_message', eventPayload);

    return eventPayload;
  }

  emitLiveMessage(chatId: string, messagePayload: any) {
    if (this.server) {
      this.server.to(chatId).emit('receive_message', messagePayload);
      this.server.emit('receive_message', messagePayload);
    }
  }
}

import api from './api';

export const messagesService = {
  /** Get all chats for the logged-in user */
  getChats: () =>
    api
      .get('/messages/chats')
      .then((r) => r.data.data || r.data),

  /** Start a new chat with another user */
  startChat: (userId: string) =>
    api
      .post(`/messages/chats/start/${userId}`)
      .then((r) => r.data.data || r.data),

  /** Get all messages inside a chat */
  getMessages: (chatId: string, page = 1, limit = 50) =>
    api
      .get(`/messages/chats/${chatId}`, { params: { page, limit } })
      .then((r) => r.data.data || r.data),

  /** Send a message */
  sendMessage: (chatId: string, content: string) =>
    api
      .post(`/messages/chats/${chatId}`, { content })
      .then((r) => r.data.data || r.data),
};

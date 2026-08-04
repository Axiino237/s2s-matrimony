import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, CheckCheck, Loader2 } from 'lucide-react';
import { messagesService } from '../../../services/messages.service';
import { getSocket } from '../../../services/socket.service';
import { useAuthStore } from '../../../store/auth.store';
import toast from 'react-hot-toast';

interface Msg {
  id: string;
  content: string;
  sent: boolean;
  isRead: boolean;
  createdAt: string;
}

const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const ChatPage = () => {
  const { id, chatId: routeChatId } = useParams<{ id?: string; chatId?: string }>();
  const chatId = routeChatId || id;
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [partnerName, setPartnerName] = useState('Loading...');
  const [partnerPhoto, setPartnerPhoto] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    if (!chatId) {
      setLoading(false);
      return;
    }
    try {
      const data = await messagesService.getMessages(chatId);
      const unique: Msg[] = [];
      if (Array.isArray(data)) {
        for (const m of data) {
          const isDup = unique.some(
            (u) =>
              u.id === m.id ||
              (u.content === m.content &&
                Math.abs(new Date(u.createdAt).getTime() - new Date(m.createdAt).getTime()) < 5000),
          );
          if (!isDup) unique.push(m);
        }
      }
      setMessages(unique);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  // Load chat info from chats list to get partner full name
  useEffect(() => {
    const loadChatInfo = async () => {
      if (!chatId) return;
      try {
        const chats = await messagesService.getChats();
        const chat = chats.find((c: any) => c.chatId === chatId);
        if (chat) {
          let name = chat.partnerName;
          if (name === 'Aravindhan R' || name === 'Aravindhan') name = 'Aravindhan Ravi';
          if (name === 'Kavitha R' || name === 'Kavitha') name = 'Kavitha Ramasamy';
          setPartnerName(name);
          setPartnerPhoto(chat.partnerPhoto);
        } else {
          setPartnerName(user?.gender === 'FEMALE' ? 'Aravindhan Ravi' : 'Kavitha Ramasamy');
        }
      } catch {
        setPartnerName(user?.gender === 'FEMALE' ? 'Aravindhan Ravi' : 'Kavitha Ramasamy');
      }
    };
    loadChatInfo();
    fetchMessages();
  }, [chatId, fetchMessages, user]);

  // WebSocket Live Real-Time Message Listener (Socket.io)
  useEffect(() => {
    if (!chatId) return;

    const socket = getSocket();

    const joinRoom = () => {
      socket.emit('join_chat', { chatId });
    };

    // Join room immediately and re-join whenever socket connects or reconnects
    joinRoom();
    socket.on('connect', joinRoom);

    const handleReceiveMessage = (msg: any) => {
      if (msg.chatId === chatId) {
        setMessages((prev) => {
          const isSentByMe = msg.senderId === user?.id;
          const existingIdx = prev.findIndex(
            (m) =>
              m.id === msg.id ||
              (m.content === msg.content && Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 5000),
          );

          if (existingIdx >= 0) {
            const updated = [...prev];
            updated[existingIdx] = {
              id: msg.id,
              content: msg.content,
              sent: isSentByMe,
              isRead: msg.isRead ?? false,
              createdAt: msg.createdAt,
            };
            return updated;
          }

          return [
            ...prev,
            {
              id: msg.id,
              content: msg.content,
              sent: isSentByMe,
              isRead: msg.isRead ?? false,
              createdAt: msg.createdAt,
            },
          ];
        });
      }
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('connect', joinRoom);
      socket.emit('leave_chat', { chatId });
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [chatId, user]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !chatId || sending) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const tempMsg: Msg = {
      id: tempId,
      content: text,
      sent: true,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      // Call REST endpoint for DB persistence and backend broadcast to chat room
      const sent = await messagesService.sendMessage(chatId, text);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { id: sent.id || tempId, content: sent.content || text, sent: true, isRead: false, createdAt: sent.createdAt || new Date().toISOString() }
            : m,
        ),
      );
    } catch {
      // Keep optimistic message or handle silently
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-10rem)] max-w-3xl mx-auto space-y-4">
      {/* Chat Header */}
      <div className="card p-4 flex items-center gap-3 bg-white shadow-sm border border-slate-200">
        <Link to="/messages" className="p-1.5 hover:bg-slate-100 rounded-xl text-text-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        {partnerPhoto ? (
          <img src={partnerPhoto} alt={partnerName} className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg border border-slate-200">💑</div>
        )}
        <div>
          <p className="text-text-primary font-bold text-sm tracking-wide">{partnerName}</p>
          <p className="text-text-muted text-[10px] flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-600 font-bold">Active Live Chat</span>
          </p>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 card p-4 overflow-y-auto bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col shadow-inner">
        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-text-muted text-sm space-y-1">
            <div className="w-12 h-12 rounded-full bg-slate-200/60 flex items-center justify-center text-2xl mb-1">💬</div>
            <p className="font-semibold text-slate-700">No messages yet</p>
            <p className="text-xs text-slate-500">Type a message below to start chatting live! 👋</p>
          </div>
        ) : (
          <div className="space-y-4 mt-auto">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sent ? 'justify-end' : 'justify-start'}`}>
                <div className="flex flex-col max-w-[75%] space-y-0.5">
                  <div className={m.sent ? 'chat-bubble-sent' : 'chat-bubble-received'}>
                    {m.content}
                  </div>
                  <span className={`text-[10px] text-text-muted flex items-center gap-0.5 px-1 ${m.sent ? 'justify-end' : 'justify-start'}`}>
                    {fmtTime(m.createdAt)}
                    {m.sent && <CheckCheck className={`w-3 h-3 ${m.isRead ? 'text-primary' : 'text-slate-400'}`} />}
                  </span>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="flex gap-2">
        <input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="input flex-1 border-slate-200 font-medium"
          placeholder="Type your message here..."
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={sending || !inputText.trim()}
          className="btn btn-primary px-5 py-3 flex items-center justify-center disabled:opacity-50 shadow-md"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export default ChatPage;

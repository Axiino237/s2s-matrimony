import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Star, Loader2, RefreshCw } from 'lucide-react';
import { messagesService } from '../../../services/messages.service';
import { getSocket } from '../../../services/socket.service';
import toast from 'react-hot-toast';

interface ChatItem {
  chatId: string;
  partnerId: string;
  partnerName: string;
  partnerPhoto: string | null;
  isVerified: boolean;
  lastMessage: string | null;
  lastMessageTime: string;
  lastMessageSentByMe: boolean;
  unreadCount: number;
}

const timeAgo = (dateStr: string) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const MessagesPage = () => {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await messagesService.getChats();
      setChats(data || []);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
    const socket = getSocket();
    const handleNewMsg = () => {
      fetchChats();
    };
    socket.on('receive_message', handleNewMsg);
    return () => {
      socket.off('receive_message', handleNewMsg);
    };
  }, [fetchChats]);

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" /> Messages & Chats
          </h1>
          <p className="text-text-secondary text-sm mt-1">Connect and converse securely with your matches</p>
        </div>
        <button onClick={fetchChats} className="btn btn-ghost btn-sm text-text-muted hover:text-primary">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : chats.length === 0 ? (
        <div className="card p-12 text-center bg-white border border-slate-200">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-text-secondary font-medium">No conversations yet</p>
          <p className="text-text-muted text-xs mt-1">Start a chat from any profile page</p>
        </div>
      ) : (
        <div className="card divide-y divide-slate-100 bg-white">
          {chats.map((item) => (
            <Link
              key={item.chatId}
              to={`/messages/${item.chatId}`}
              className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
            >
              {/* Avatar */}
              <div className="relative w-12 h-12 flex-shrink-0">
                {item.partnerPhoto ? (
                  <img
                    src={item.partnerPhoto}
                    alt={item.partnerName}
                    className="w-full h-full rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-xl border border-slate-200">
                    💑
                  </div>
                )}
                {item.isVerified && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] text-white">✓</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-text-primary font-bold text-sm truncate">{item.partnerName}</p>
                </div>
                <p className="text-text-muted text-xs truncate mt-1">
                  {item.lastMessage
                    ? `${item.lastMessageSentByMe ? 'You: ' : ''}${item.lastMessage}`
                    : 'No messages yet — say hello!'}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-text-muted text-xs">{timeAgo(item.lastMessageTime)}</p>
                {item.unreadCount > 0 && (
                  <span className="badge badge-active text-[10px] mt-1 px-2 py-0.5">{item.unreadCount}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessagesPage;

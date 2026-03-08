import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ArrowLeft, Send, Sparkles, HandMetal } from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-50b042b1`;

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName?: string;
  timestamp: number;
}

interface Chat {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  messages: Message[];
  isNewMatch?: boolean;
  matchedAt?: number;
}

export default function Messages() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = JSON.parse(localStorage.getItem('friendli_user') || '{}');

  const loadChats = useCallback(() => {
    // Load from localStorage (source of truth for now)
    const savedChats: Chat[] = JSON.parse(localStorage.getItem('friendli_chats') || '[]');

    // Also try to sync messages from server for each chat
    if (savedChats.length > 0) {
      Promise.all(
        savedChats.map(async (chat) => {
          try {
            const res = await fetch(`${API_BASE}/messages/${chat.id}`, {
              headers: { Authorization: `Bearer ${publicAnonKey}` },
            });
            if (res.ok) {
              const data = await res.json();
              if (data.messages && data.messages.length > 0) {
                // Merge server messages with local (server is source of truth for messages)
                return { ...chat, messages: data.messages, isNewMatch: data.messages.length === 0 && chat.isNewMatch };
              }
            }
          } catch (err) {
            console.log(`Error syncing messages for chat ${chat.id}:`, err);
          }
          return chat;
        })
      ).then((syncedChats) => {
        setChats(syncedChats);
        // Update localStorage with synced data
        localStorage.setItem('friendli_chats', JSON.stringify(syncedChats));
      });
    }

    setChats(savedChats);
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.messages]);

  // Poll for new messages when in a chat
  useEffect(() => {
    if (!selectedChat) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/messages/${selectedChat.id}`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > (selectedChat.messages?.length || 0)) {
            const updatedChat = { ...selectedChat, messages: data.messages };
            setSelectedChat(updatedChat);
            // Update in chats list too
            setChats(prev => {
              const updated = prev.map(c => c.id === selectedChat.id ? updatedChat : c);
              localStorage.setItem('friendli_chats', JSON.stringify(updated));
              return updated;
            });
          }
        }
      } catch (err) {
        console.log("Error polling messages:", err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [selectedChat?.id, selectedChat?.messages?.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedChat || sending) return;

    setSending(true);

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      text: messageText,
      senderId: currentUser.id,
      senderName: currentUser.name || "you",
      timestamp: Date.now()
    };

    // Optimistic update locally
    const updatedChat = {
      ...selectedChat,
      messages: [...selectedChat.messages, newMessage],
      isNewMatch: false
    };

    const updatedChats = chats.map(chat => 
      chat.id === selectedChat.id ? updatedChat : chat
    );

    setChats(updatedChats);
    setSelectedChat(updatedChat);
    localStorage.setItem('friendli_chats', JSON.stringify(updatedChats));
    setMessageText("");

    // Send to server
    try {
      const res = await fetch(`${API_BASE}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          chatId: selectedChat.id,
          senderId: currentUser.id,
          senderName: currentUser.name || "you",
          text: messageText,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.log("Error sending message to server:", errData);
      }
    } catch (err) {
      console.log("Error sending message to server:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const openChat = (chat: Chat) => {
    setSelectedChat(chat);
  };

  // Sort chats: new matches first, then by most recent message/match time
  const sortedChats = [...chats].sort((a, b) => {
    // New matches first
    if (a.isNewMatch && !b.isNewMatch) return -1;
    if (!a.isNewMatch && b.isNewMatch) return 1;

    const aTime = a.messages.length > 0 
      ? a.messages[a.messages.length - 1].timestamp 
      : (a.matchedAt || 0);
    const bTime = b.messages.length > 0 
      ? b.messages[b.messages.length - 1].timestamp 
      : (b.matchedAt || 0);
    return bTime - aTime;
  });

  if (selectedChat) {
    return (
      <div className="flex flex-col h-full min-h-screen">
        {/* Chat Header */}
        <div className="bg-white border-b border-[#EE964B]/20 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => { setSelectedChat(null); loadChats(); }}
            className="text-[#0D3B66] hover:text-[#EE964B]"
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <img 
            src={selectedChat.userPhoto} 
            alt={selectedChat.userName}
            className="w-9 h-9 rounded-full object-cover border-2 border-[#EE964B]"
          />
          <div>
            <h3 className="font-bold text-[#0D3B66] lowercase text-sm">{selectedChat.userName}</h3>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#FDFAEC]">
          {selectedChat.messages.length === 0 && (
            <div className="text-center py-10">
              <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm mx-auto space-y-3">
                <Sparkles size={28} className="text-[#EE964B] mx-auto" />
                <h3 className="text-base font-bold text-[#0D3B66] lowercase">you matched with {selectedChat.userName}!</h3>
                <p className="text-[#0D3B66]/60 text-sm lowercase font-medium">
                  break the ice and send the first message
                </p>
              </div>
            </div>
          )}

          {selectedChat.messages.map((message) => {
            const isCurrentUser = message.senderId === currentUser.id;
            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isCurrentUser
                      ? 'bg-[#EE964B] text-white'
                      : 'bg-white text-[#0D3B66]'
                  }`}
                >
                  <p className="text-sm lowercase font-medium">{message.text}</p>
                  <p className={`text-[10px] mt-1 ${isCurrentUser ? 'text-white/60' : 'text-[#0D3B66]/40'}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-[#EE964B]/20 px-4 py-3">
          <div className="flex gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="type a message..."
              className="flex-1 lowercase bg-[#FDFAEC] border-[#EE964B]/30"
            />
            <Button
              onClick={sendMessage}
              disabled={!messageText.trim() || sending}
              className="bg-[#EE964B] hover:bg-[#EE964B]/90 text-white"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-4 pt-5 pb-3 border-b border-[#EE964B]/15">
        <h1 className="text-2xl font-black text-[#0D3B66] lowercase">messages</h1>
        <p className="text-[#EE964B] lowercase text-sm font-semibold">your friendships</p>
      </div>

      {/* Chat List */}
      <div className="px-4 py-4">
        {sortedChats.length > 0 ? (
          <div className="space-y-3">
            {sortedChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => openChat(chat)}
                className="w-full bg-white rounded-xl shadow-md p-3.5 flex items-center gap-3 hover:shadow-lg transition-shadow active:scale-[0.98]"
              >
                {/* Profile pic with orange ring for new matches */}
                <div className="relative flex-shrink-0">
                  <img 
                    src={chat.userPhoto} 
                    alt={chat.userName}
                    className={`w-12 h-12 rounded-full object-cover border-2 ${
                      chat.isNewMatch ? 'border-[#EE964B]' : 'border-[#0D3B66]/15'
                    }`}
                  />
                  {chat.isNewMatch && (
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#EE964B] rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#0D3B66] lowercase text-sm">{chat.userName}</h3>
                    {chat.isNewMatch && chat.messages.length === 0 && (
                      <span className="bg-gradient-to-r from-[#EE964B] to-[#F95738] text-white text-[10px] px-2 py-0.5 rounded-full lowercase font-bold">
                        new
                      </span>
                    )}
                  </div>
                  {chat.messages.length > 0 ? (
                    <p className="text-xs text-[#0D3B66]/60 lowercase truncate font-medium">
                      {chat.messages[chat.messages.length - 1].senderId === currentUser.id ? 'you: ' : ''}
                      {chat.messages[chat.messages.length - 1].text}
                    </p>
                  ) : (
                    <p className="text-xs text-[#0D3B66]/45 lowercase font-medium flex items-center gap-1">
                      say hi to your new match <span className="text-base">👋</span>
                    </p>
                  )}
                </div>
                {/* Timestamp */}
                <div className="text-[10px] text-[#0D3B66]/40 font-medium flex-shrink-0">
                  {chat.messages.length > 0
                    ? new Date(chat.messages[chat.messages.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : chat.matchedAt 
                      ? 'just now'
                      : ''
                  }
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center space-y-3">
            <HandMetal className="mx-auto text-[#EE964B]" size={36} />
            <h2 className="text-lg font-bold text-[#0D3B66] lowercase">no messages yet</h2>
            <p className="text-[#0D3B66]/70 lowercase text-sm font-medium">
              start friendifying people to make new connections!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

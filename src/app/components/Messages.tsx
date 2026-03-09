import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ArrowLeft, Send, Sparkles, HandMetal, CheckCheck, MessageCircle, Heart } from "lucide-react";
import { motion } from "motion/react";
import * as api from "@/lib/api";
import { Dialog, DialogContent } from "./ui/dialog";

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName?: string;
  timestamp: number;
}

interface Chat {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantPhotos: Record<string, string>;
  messages: Message[];
  isNewMatch?: boolean;
  matchedAt?: number;
  deletedParticipants?: string[];
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-white text-[#0D3B66] rounded-2xl px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block w-2 h-2 rounded-full bg-[#0D3B66]/40"
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Messages() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [readAt, setReadAt] = useState<number | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  const currentUser = api.getCurrentUser();

  const getOtherUserId = useCallback((chat: Chat) => {
    return chat.participants?.find((id: string) => id !== currentUser?.id) || "";
  }, [currentUser?.id]);

  const getOtherUserName = useCallback((chat: Chat) => {
    const otherId = getOtherUserId(chat);
    if (chat.deletedParticipants?.includes(otherId)) return "[deleted account]";
    return chat.participantNames?.[otherId] || "unknown";
  }, [getOtherUserId]);

  const getOtherUserPhoto = useCallback((chat: Chat) => {
    const otherId = getOtherUserId(chat);
    if (chat.deletedParticipants?.includes(otherId)) return "";
    return chat.participantPhotos?.[otherId] || "";
  }, [getOtherUserId]);

  const isOtherUserDeleted = useCallback((chat: Chat) => {
    const otherId = getOtherUserId(chat);
    return chat.deletedParticipants?.includes(otherId) ?? false;
  }, [getOtherUserId]);

  const loadChats = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const result = await api.getChats(currentUser.id);
      setChats(result.chats || []);
    } catch (err) {
      console.error("Error loading chats:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.messages, otherUserTyping]);

  // Mark chat as read when opening it
  useEffect(() => {
    if (!selectedChat || !currentUser?.id) return;
    api.markRead(selectedChat.id, currentUser.id);
  }, [selectedChat?.id, currentUser?.id]);

  // Poll for new messages when in a chat
  useEffect(() => {
    if (!selectedChat) return;
    const interval = setInterval(async () => {
      try {
        const result = await api.getMessages(selectedChat.id);
        if (result.messages && result.messages.length > (selectedChat.messages?.length || 0)) {
          const updatedChat = { ...selectedChat, messages: result.messages };
          setSelectedChat(updatedChat);
          setChats(prev => prev.map(c => c.id === selectedChat.id ? updatedChat : c));
          // Re-mark as read when new messages arrive
          if (currentUser?.id) {
            api.markRead(selectedChat.id, currentUser.id);
          }
        }
      } catch (err) {
        console.error("Error polling messages:", err);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedChat?.id, selectedChat?.messages?.length, currentUser?.id]);

  // Poll for typing indicator from the other user
  useEffect(() => {
    if (!selectedChat || !currentUser?.id) return;
    const otherId = getOtherUserId(selectedChat);
    if (!otherId || isOtherUserDeleted(selectedChat)) return;

    const interval = setInterval(async () => {
      try {
        const result = await api.getTyping(selectedChat.id, otherId);
        setOtherUserTyping(!!result?.isTyping);
      } catch {
        setOtherUserTyping(false);
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      setOtherUserTyping(false);
    };
  }, [selectedChat?.id, currentUser?.id, getOtherUserId, isOtherUserDeleted]);

  // Poll for read receipts from the other user
  useEffect(() => {
    if (!selectedChat || !currentUser?.id) return;
    const otherId = getOtherUserId(selectedChat);
    if (!otherId || isOtherUserDeleted(selectedChat)) return;

    const pollReadReceipt = async () => {
      try {
        const result = await api.getReadReceipt(selectedChat.id, otherId);
        setReadAt(result?.readAt ?? null);
      } catch {
        // ignore
      }
    };

    pollReadReceipt();
    const interval = setInterval(pollReadReceipt, 5000);

    return () => {
      clearInterval(interval);
      setReadAt(null);
    };
  }, [selectedChat?.id, currentUser?.id, getOtherUserId, isOtherUserDeleted]);

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (selectedChat?.id && currentUser?.id) {
        api.setTyping(selectedChat.id, currentUser.id, false).catch(() => {});
      }
    };
  }, [selectedChat?.id, currentUser?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleTyping = useCallback(() => {
    if (!selectedChat || !currentUser?.id) return;

    const now = Date.now();
    // Debounce: only send typing every 2 seconds
    if (now - lastTypingSentRef.current >= 2000) {
      api.setTyping(selectedChat.id, currentUser.id, true);
      lastTypingSentRef.current = now;
    }

    // Clear previous stop-typing timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      api.setTyping(selectedChat.id, currentUser.id, false);
      lastTypingSentRef.current = 0;
    }, 2000);
  }, [selectedChat?.id, currentUser?.id]);

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedChat || sending || !currentUser) return;
    setSending(true);

    // Stop typing indicator on send
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    api.setTyping(selectedChat.id, currentUser.id, false);
    lastTypingSentRef.current = 0;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      text: messageText,
      senderId: currentUser.id,
      senderName: currentUser.name || "you",
      timestamp: Date.now()
    };

    const updatedChat = {
      ...selectedChat,
      messages: [...(selectedChat.messages || []), newMessage],
      isNewMatch: false
    };

    setChats(prev => prev.map(chat => chat.id === selectedChat.id ? updatedChat : chat));
    setSelectedChat(updatedChat);
    setMessageText("");

    try {
      await api.sendMessage(selectedChat.id, currentUser.id, currentUser.name || "you", messageText);
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    if (e.target.value.length > 0) {
      handleTyping();
    }
  };

  // Cache profiles so repeat taps are instant
  const profileCacheRef = useRef<Record<string, unknown>>({});

  const handleViewProfile = async (userId: string) => {
    // Show cached data immediately if available
    if (profileCacheRef.current[userId]) {
      setProfileData(profileCacheRef.current[userId]);
      setShowProfile(true);
      return;
    }
    // Show dialog immediately with basic info from chat
    const chat = chats.find(c => c.participants?.includes(userId));
    if (chat) {
      setProfileData({
        name: chat.participantNames?.[userId] || "loading...",
        profilePhoto: chat.participantPhotos?.[userId] || null,
      });
      setShowProfile(true);
    }
    // Fetch full profile in background
    try {
      const result = await api.getUser(userId);
      profileCacheRef.current[userId] = result.user;
      setProfileData(result.user);
      if (!chat) setShowProfile(true);
    } catch { /* ignore */ }
  };

  // Sort chats: new matches first, then by most recent message/match time
  const sortedChats = [...chats].sort((a, b) => {
    if (a.isNewMatch && !b.isNewMatch) return -1;
    if (!a.isNewMatch && b.isNewMatch) return 1;
    const aTime = a.messages?.length > 0 ? a.messages[a.messages.length - 1].timestamp : (a.matchedAt || 0);
    const bTime = b.messages?.length > 0 ? b.messages[b.messages.length - 1].timestamp : (b.matchedAt || 0);
    return bTime - aTime;
  });

  if (selectedChat) {
    const otherName = getOtherUserName(selectedChat);
    const otherPhoto = getOtherUserPhoto(selectedChat);
    const deleted = isOtherUserDeleted(selectedChat);

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-shrink-0 border-b border-[#EE964B]/15 px-4 py-3 flex items-center gap-3">
          <button onClick={() => { setSelectedChat(null); loadChats(); }} className="text-[#0D3B66] hover:text-[#EE964B]">
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <button onClick={() => !deleted && handleViewProfile(getOtherUserId(selectedChat))} className="flex items-center gap-3 flex-1" disabled={deleted}>
            {deleted ? (
              <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center border-2 border-gray-400">
                <span className="text-gray-500 font-bold text-sm">?</span>
              </div>
            ) : otherPhoto ? (
              <img src={otherPhoto} alt={otherName} className="w-9 h-9 rounded-full object-cover border-2 border-[#EE964B]" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#EE964B]/20 flex items-center justify-center border-2 border-[#EE964B]">
                <span className="text-[#EE964B] font-bold text-sm">{otherName?.[0]?.toUpperCase()}</span>
              </div>
            )}
            <div>
              <h3 className={`font-bold lowercase text-sm ${deleted ? "text-gray-400" : "text-[#0D3B66]"}`}>{otherName}</h3>
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-3 bg-[#FDFAEC]">
          {deleted && (
            <div className="flex justify-center py-2">
              <div className="bg-gray-100 border border-gray-200 rounded-full px-4 py-1.5">
                <p className="text-xs text-gray-400 lowercase font-medium">this user has deleted their account</p>
              </div>
            </div>
          )}

          {(!selectedChat.messages || selectedChat.messages.length === 0) && !deleted && (
            <div className="text-center py-10">
              <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm mx-auto space-y-4">
                <div className="relative mx-auto w-16 h-16">
                  <div className="absolute inset-0 bg-[#EE964B]/10 rounded-full" />
                  <div className="absolute inset-2 bg-[#EE964B]/20 rounded-full" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles size={28} className="text-[#EE964B]" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-[#0D3B66] lowercase">you matched with {otherName}!</h3>
                <p className="text-[#0D3B66]/60 text-sm lowercase font-medium">break the ice and send the first message</p>
                <div className="flex justify-center gap-1 pt-1">
                  <Heart size={12} className="text-[#EE964B]/40" />
                  <Heart size={12} className="text-[#EE964B]/60" />
                  <Heart size={12} className="text-[#EE964B]/40" />
                </div>
              </div>
            </div>
          )}

          {(!selectedChat.messages || selectedChat.messages.length === 0) && deleted && (
            <div className="text-center py-10">
              <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm mx-auto space-y-4">
                <div className="relative mx-auto w-16 h-16">
                  <div className="absolute inset-0 bg-gray-100 rounded-full" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MessageCircle size={28} className="text-gray-300" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-gray-400 lowercase">no messages</h3>
                <p className="text-gray-400/80 text-sm lowercase font-medium">this conversation is no longer active</p>
              </div>
            </div>
          )}

          {(selectedChat.messages || []).map((message) => {
            const isCurrentUser = message.senderId === currentUser?.id;
            const isRead = isCurrentUser && readAt !== null && message.timestamp <= readAt;

            return (
              <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isCurrentUser ? "bg-[#EE964B] text-white" : "bg-white text-[#0D3B66]"}`}>
                  <p className="text-sm lowercase font-medium">{message.text}</p>
                  <div className={`flex items-center gap-1 mt-1 ${isCurrentUser ? "justify-end" : ""}`}>
                    <p className={`text-[10px] ${isCurrentUser ? "text-white/60" : "text-[#0D3B66]/40"}`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {isRead && (
                      <CheckCheck size={12} className="text-white/80" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {otherUserTyping && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        <div className="flex-shrink-0 px-4 py-2">
          {deleted ? (
            <div className="flex items-center justify-center py-1">
              <p className="text-xs text-gray-400 lowercase font-medium">you can no longer send messages to this conversation</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={messageText}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder="type a message..."
                className="flex-1 lowercase bg-[#FDFAEC] border-[#EE964B]/30"
              />
              <Button onClick={sendMessage} disabled={!messageText.trim() || sending} className="bg-[#EE964B] hover:bg-[#EE964B]/90 text-white">
                <Send size={18} />
              </Button>
            </div>
          )}
        </div>

        <Dialog open={showProfile} onOpenChange={setShowProfile}>
          <DialogContent className="bg-white max-w-[400px] max-h-[85vh] overflow-y-auto p-0 rounded-2xl">
            {profileData && (
              <div className="p-4 space-y-3">
                {/* Profile photo */}
                <div className="flex items-center gap-3">
                  {profileData.profilePhoto ? (
                    <img src={profileData.profilePhoto} alt={profileData.name} className="w-16 h-16 rounded-full object-cover border-2 border-[#EE964B]" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#EE964B]/20 flex items-center justify-center border-2 border-[#EE964B]">
                      <span className="text-[#EE964B] font-bold text-2xl">{profileData.name?.[0]?.toUpperCase()}</span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-[#0D3B66] lowercase">{profileData.name}, {profileData.age}</h3>
                    <p className="text-sm text-[#0D3B66]/50 lowercase">{profileData.city}{profileData.almaMater ? ` - ${profileData.almaMater}` : ""}</p>
                  </div>
                </div>

                {/* Hobby photos */}
                {profileData.hobbyPhotos && Object.keys(profileData.hobbyPhotos).length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {Object.entries(profileData.hobbyPhotos).map(([hobby, url]: [string, any]) => (
                      url && (
                        <div key={hobby} className="flex-shrink-0 relative">
                          <img src={url} alt={hobby} className="w-24 h-24 rounded-xl object-cover" />
                          <span className="absolute bottom-1 left-1 bg-[#EE964B] text-white text-[9px] px-2 py-0.5 rounded-full lowercase font-bold">{hobby}</span>
                        </div>
                      )
                    ))}
                  </div>
                )}

                {/* Hobbies */}
                {profileData.hobbies?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {profileData.hobbies.map((hobby: string) => (
                      <span key={hobby} className="px-2.5 py-1 rounded-full bg-[#EE964B]/10 text-[#EE964B] text-xs lowercase font-semibold">{hobby}</span>
                    ))}
                  </div>
                )}

                {/* Looking for */}
                {profileData.lookingFor && (
                  <div>
                    <p className="text-xs text-[#0D3B66]/40 lowercase font-semibold mb-1">looking for</p>
                    <p className="text-sm text-[#0D3B66] lowercase font-medium">{profileData.lookingFor}</p>
                  </div>
                )}

                {/* Fun fact */}
                {profileData.funFact && (
                  <div>
                    <p className="text-xs text-[#0D3B66]/40 lowercase font-semibold mb-1">fun fact</p>
                    <p className="text-sm text-[#0D3B66] lowercase font-medium italic">{profileData.funFact}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-4 pt-5 pb-3 border-b border-[#EE964B]/15">
        <h1 className="text-2xl font-black text-[#0D3B66] lowercase">messages</h1>
        <p className="text-[#EE964B] lowercase text-sm font-semibold">your friendships</p>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="text-center py-10">
            <p className="text-[#0D3B66]/50 lowercase font-medium">loading chats...</p>
          </div>
        ) : sortedChats.length > 0 ? (
          <div className="space-y-3">
            {sortedChats.map((chat) => {
              const otherName = getOtherUserName(chat);
              const otherPhoto = getOtherUserPhoto(chat);
              const deleted = isOtherUserDeleted(chat);
              const lastMsg = chat.messages?.length > 0 ? chat.messages[chat.messages.length - 1] : null;

              return (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className="w-full bg-white rounded-xl shadow-md p-3.5 flex items-center gap-3 hover:shadow-lg transition-shadow active:scale-[0.98]"
                >
                  <div
                    className="relative flex-shrink-0 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!deleted) handleViewProfile(getOtherUserId(chat));
                    }}
                  >
                    {deleted ? (
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center border-2 border-gray-400">
                        <span className="text-gray-500 font-bold">?</span>
                      </div>
                    ) : otherPhoto ? (
                      <img src={otherPhoto} alt={otherName}
                        className={`w-12 h-12 rounded-full object-cover border-2 ${chat.isNewMatch ? "border-[#EE964B]" : "border-[#0D3B66]/15"}`} />
                    ) : (
                      <div className={`w-12 h-12 rounded-full bg-[#EE964B]/20 flex items-center justify-center border-2 ${chat.isNewMatch ? "border-[#EE964B]" : "border-[#0D3B66]/15"}`}>
                        <span className="text-[#EE964B] font-bold">{otherName?.[0]?.toUpperCase()}</span>
                      </div>
                    )}
                    {chat.isNewMatch && (
                      <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#EE964B] rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold lowercase text-sm ${deleted ? "text-gray-400" : "text-[#0D3B66]"}`}>{otherName}</h3>
                      {chat.isNewMatch && (!chat.messages || chat.messages.length === 0) && (
                        <span className="bg-gradient-to-r from-[#EE964B] to-[#F95738] text-white text-[10px] px-2 py-0.5 rounded-full lowercase font-bold">new</span>
                      )}
                    </div>
                    {lastMsg ? (
                      <p className="text-xs text-[#0D3B66]/60 lowercase truncate font-medium">
                        {lastMsg.senderId === currentUser?.id ? "you: " : ""}{lastMsg.text}
                      </p>
                    ) : (
                      <p className="text-xs text-[#0D3B66]/45 lowercase font-medium flex items-center gap-1">
                        {deleted ? "account deleted" : "say hi to your new match"}
                      </p>
                    )}
                  </div>
                  <div className="text-[10px] text-[#0D3B66]/40 font-medium flex-shrink-0">
                    {lastMsg
                      ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : chat.matchedAt ? "just now" : ""}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 bg-[#EE964B]/10 rounded-full animate-pulse" />
              <div className="absolute inset-3 bg-[#EE964B]/15 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <HandMetal className="text-[#EE964B]" size={36} />
              </div>
            </div>
            <h2 className="text-lg font-bold text-[#0D3B66] lowercase">no messages yet</h2>
            <p className="text-[#0D3B66]/60 lowercase text-sm font-medium max-w-xs mx-auto">
              start friendifying people to make new connections and your conversations will show up here!
            </p>
            <div className="flex justify-center gap-2 pt-1">
              <MessageCircle size={14} className="text-[#EE964B]/30" />
              <MessageCircle size={16} className="text-[#EE964B]/50" />
              <MessageCircle size={14} className="text-[#EE964B]/30" />
            </div>
          </div>
        )}
      </div>

      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="bg-white max-w-[400px] max-h-[85vh] overflow-y-auto p-0 rounded-2xl">
          {profileData && (
            <div className="p-4 space-y-3">
              {/* Profile photo */}
              <div className="flex items-center gap-3">
                {profileData.profilePhoto ? (
                  <img src={profileData.profilePhoto} alt={profileData.name} className="w-16 h-16 rounded-full object-cover border-2 border-[#EE964B]" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#EE964B]/20 flex items-center justify-center border-2 border-[#EE964B]">
                    <span className="text-[#EE964B] font-bold text-2xl">{profileData.name?.[0]?.toUpperCase()}</span>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-[#0D3B66] lowercase">{profileData.name}, {profileData.age}</h3>
                  <p className="text-sm text-[#0D3B66]/50 lowercase">{profileData.city}{profileData.almaMater ? ` - ${profileData.almaMater}` : ""}</p>
                </div>
              </div>

              {/* Hobby photos */}
              {profileData.hobbyPhotos && Object.keys(profileData.hobbyPhotos).length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {Object.entries(profileData.hobbyPhotos).map(([hobby, url]: [string, any]) => (
                    url && (
                      <div key={hobby} className="flex-shrink-0 relative">
                        <img src={url} alt={hobby} className="w-24 h-24 rounded-xl object-cover" />
                        <span className="absolute bottom-1 left-1 bg-[#EE964B] text-white text-[9px] px-2 py-0.5 rounded-full lowercase font-bold">{hobby}</span>
                      </div>
                    )
                  ))}
                </div>
              )}

              {/* Hobbies */}
              {profileData.hobbies?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {profileData.hobbies.map((hobby: string) => (
                    <span key={hobby} className="px-2.5 py-1 rounded-full bg-[#EE964B]/10 text-[#EE964B] text-xs lowercase font-semibold">{hobby}</span>
                  ))}
                </div>
              )}

              {/* Looking for */}
              {profileData.lookingFor && (
                <div>
                  <p className="text-xs text-[#0D3B66]/40 lowercase font-semibold mb-1">looking for</p>
                  <p className="text-sm text-[#0D3B66] lowercase font-medium">{profileData.lookingFor}</p>
                </div>
              )}

              {/* Fun fact */}
              {profileData.funFact && (
                <div>
                  <p className="text-xs text-[#0D3B66]/40 lowercase font-semibold mb-1">fun fact</p>
                  <p className="text-sm text-[#0D3B66] lowercase font-medium italic">{profileData.funFact}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

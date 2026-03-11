import { projectId, publicAnonKey } from "/utils/supabase/info";

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-50b042b1`;

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${publicAnonKey}`,
};

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// Auth
export async function register(email: string, password: string, name: string) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export async function login(email: string, password: string) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Users
export async function updateUser(userId: string, data: Record<string, unknown>) {
  return request(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getUser(userId: string) {
  return request(`/users/${userId}`);
}

export async function discoverUsers(userId: string) {
  return request(`/discover/${userId}`);
}

// Friendify & Matching
export async function friendify(fromUserId: string, toUserId: string) {
  return request("/friendify", {
    method: "POST",
    body: JSON.stringify({ fromUserId, toUserId }),
  });
}

export async function reject(fromUserId: string, toUserId: string) {
  return request("/reject", {
    method: "POST",
    body: JSON.stringify({ fromUserId, toUserId }),
  });
}

export async function getReceivedFriendifies(userId: string) {
  return request(`/friendify/received/${userId}`);
}

export async function getInteractions(userId: string) {
  return request(`/interactions/${userId}`);
}

// Premium
export async function startTrial(userId: string) {
  return request("/premium/trial", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function checkPremium(userId: string) {
  return request(`/premium/${userId}`);
}

// Chats & Messages
export async function getChats(userId: string) {
  return request(`/chats/${userId}`);
}

export async function getMessages(chatId: string) {
  return request(`/messages/${chatId}`);
}

export async function sendMessage(chatId: string, senderId: string, senderName: string, text: string) {
  return request("/messages", {
    method: "POST",
    body: JSON.stringify({ chatId, senderId, senderName, text }),
  });
}

// Account deletion
export async function deleteAccount(userId: string) {
  return request(`/users/${userId}`, { method: "DELETE" });
}

// Combined chat state (messages + typing + read receipt in one call)
export async function getChatState(chatId: string, userId: string) {
  return request(`/chat-state/${chatId}/${userId}`);
}

// Typing indicators
export async function setTyping(chatId: string, userId: string, isTyping: boolean) {
  return request("/typing", {
    method: "POST",
    body: JSON.stringify({ chatId, userId, isTyping }),
  });
}

export async function getTyping(chatId: string, otherUserId: string) {
  return request(`/typing/${chatId}/${otherUserId}`);
}

// Read receipts
export async function markRead(chatId: string, userId: string) {
  return request("/messages/read", {
    method: "POST",
    body: JSON.stringify({ chatId, userId }),
  });
}

export async function getReadReceipt(chatId: string, otherUserId: string) {
  return request(`/messages/read/${chatId}/${otherUserId}`);
}

// Helper to get current user from localStorage
export function getCurrentUser() {
  const raw = localStorage.getItem("friendli_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: Record<string, unknown>) {
  localStorage.setItem("friendli_user", JSON.stringify(user));
}

export function clearCurrentUser() {
  localStorage.removeItem("friendli_user");
  localStorage.removeItem("friendli_onboarded");
}

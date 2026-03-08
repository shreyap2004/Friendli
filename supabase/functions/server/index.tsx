import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-50b042b1/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== CHAT & MESSAGING ROUTES ====================

// Create a new chat (when a match happens)
app.post("/make-server-50b042b1/chats", async (c) => {
  try {
    const body = await c.req.json();
    const { chatId, userId, matchedUserId, userName, userPhoto } = body;

    if (!chatId || !userId) {
      return c.json({ error: "Missing chatId or userId" }, 400);
    }

    const chatData = {
      id: chatId,
      userId,
      matchedUserId,
      userName,
      userPhoto,
      messages: [],
      isNewMatch: true,
      matchedAt: Date.now(),
    };

    // Store the chat under both users
    await kv.set(`chat:${chatId}`, chatData);

    // Add chat ID to the user's chat list
    const userChats = (await kv.get(`user_chats:${userId}`)) || [];
    if (!userChats.includes(chatId)) {
      userChats.push(chatId);
      await kv.set(`user_chats:${userId}`, userChats);
    }

    // If matchedUserId exists, also add to their chat list
    if (matchedUserId) {
      const matchedUserChats = (await kv.get(`user_chats:${matchedUserId}`)) || [];
      if (!matchedUserChats.includes(chatId)) {
        matchedUserChats.push(chatId);
        await kv.set(`user_chats:${matchedUserId}`, matchedUserChats);
      }
    }

    console.log(`Chat created: ${chatId} between ${userId} and ${matchedUserId}`);
    return c.json({ success: true, chat: chatData });
  } catch (err) {
    console.log(`Error creating chat: ${err}`);
    return c.json({ error: `Failed to create chat: ${err}` }, 500);
  }
});

// Get all chats for a user
app.get("/make-server-50b042b1/chats/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const chatIds = (await kv.get(`user_chats:${userId}`)) || [];

    if (chatIds.length === 0) {
      return c.json({ chats: [] });
    }

    const chatKeys = chatIds.map((id: string) => `chat:${id}`);
    const chats = await kv.mget(chatKeys);

    return c.json({ chats: chats.filter(Boolean) });
  } catch (err) {
    console.log(`Error fetching chats for user: ${err}`);
    return c.json({ error: `Failed to fetch chats: ${err}` }, 500);
  }
});

// Send a message in a chat
app.post("/make-server-50b042b1/messages", async (c) => {
  try {
    const body = await c.req.json();
    const { chatId, senderId, text, senderName } = body;

    if (!chatId || !senderId || !text) {
      return c.json({ error: "Missing chatId, senderId, or text" }, 400);
    }

    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      senderId,
      senderName: senderName || "unknown",
      timestamp: Date.now(),
    };

    // Get the chat and append the message
    const chat = await kv.get(`chat:${chatId}`);
    if (!chat) {
      return c.json({ error: `Chat not found: ${chatId}` }, 404);
    }

    chat.messages = chat.messages || [];
    chat.messages.push(message);
    chat.isNewMatch = false;

    await kv.set(`chat:${chatId}`, chat);

    console.log(`Message sent in chat ${chatId} by ${senderId}: ${text.substring(0, 50)}`);
    return c.json({ success: true, message });
  } catch (err) {
    console.log(`Error sending message: ${err}`);
    return c.json({ error: `Failed to send message: ${err}` }, 500);
  }
});

// Get messages for a chat
app.get("/make-server-50b042b1/messages/:chatId", async (c) => {
  try {
    const chatId = c.req.param("chatId");
    const chat = await kv.get(`chat:${chatId}`);

    if (!chat) {
      return c.json({ messages: [] });
    }

    return c.json({ messages: chat.messages || [] });
  } catch (err) {
    console.log(`Error fetching messages: ${err}`);
    return c.json({ error: `Failed to fetch messages: ${err}` }, 500);
  }
});

Deno.serve(app.fetch);

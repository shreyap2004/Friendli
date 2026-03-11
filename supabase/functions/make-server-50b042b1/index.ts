import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.ts";
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

const PREFIX = "/make-server-50b042b1";

// Simple hash for demo purposes (NOT production-grade)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Health check endpoint
app.get(`${PREFIX}/health`, (c) => {
  return c.json({ status: "ok" });
});

// ==================== USER AUTH & PROFILE ROUTES ====================

// Register a new user
app.post(`${PREFIX}/auth/register`, async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return c.json({ error: "Missing email, password, or name" }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await kv.get(`user_email:${normalizedEmail}`);
    if (existing) {
      return c.json({ error: "An account with this email already exists" }, 409);
    }

    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const hashedPassword = simpleHash(password);

    const user = {
      id: userId,
      email: normalizedEmail,
      name: name.toLowerCase().trim(),
      passwordHash: hashedPassword,
      createdAt: Date.now(),
      onboarded: false,
      premium: false,
      premiumTrialStart: null,
    };

    // Store user by ID and by email (for login lookup)
    await kv.set(`user:${userId}`, user);
    await kv.set(`user_email:${normalizedEmail}`, userId);

    // Add user ID to the users list for discovery
    const usersList = (await kv.get("users:list")) || [];
    if (!usersList.includes(userId)) {
      usersList.push(userId);
      await kv.set("users:list", usersList);
    }

    // Return user without password
    const { passwordHash: _, ...safeUser } = user;
    console.log(`User registered: ${normalizedEmail} (${userId})`);
    return c.json({ success: true, user: safeUser });
  } catch (err) {
    console.log(`Error registering user: ${err}`);
    return c.json({ error: `Failed to register: ${err}` }, 500);
  }
});

// Login
app.post(`${PREFIX}/auth/login`, async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: "Missing email or password" }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Look up user ID by email
    const userId = await kv.get(`user_email:${normalizedEmail}`);
    if (!userId) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Get user data
    const user = await kv.get(`user:${userId}`);
    if (!user) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Check password
    const hashedPassword = simpleHash(password);
    if (user.passwordHash !== hashedPassword) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Return user without password
    const { passwordHash: _, ...safeUser } = user;
    console.log(`User logged in: ${normalizedEmail}`);
    return c.json({ success: true, user: safeUser });
  } catch (err) {
    console.log(`Error logging in: ${err}`);
    return c.json({ error: `Failed to login: ${err}` }, 500);
  }
});

// Update user profile (after onboarding or profile edit)
app.put(`${PREFIX}/users/:userId`, async (c) => {
  try {
    const userId = c.req.param("userId");
    const body = await c.req.json();

    const existing = await kv.get(`user:${userId}`);
    if (!existing) {
      return c.json({ error: "User not found" }, 404);
    }

    // Merge updates (don't allow overwriting sensitive fields)
    const updated = {
      ...existing,
      ...body,
      id: existing.id,
      email: existing.email,
      passwordHash: existing.passwordHash,
      createdAt: existing.createdAt,
    };

    await kv.set(`user:${userId}`, updated);

    const { passwordHash: _, ...safeUser } = updated;
    console.log(`User updated: ${userId}`);
    return c.json({ success: true, user: safeUser });
  } catch (err) {
    console.log(`Error updating user: ${err}`);
    return c.json({ error: `Failed to update user: ${err}` }, 500);
  }
});

// Get user profile
app.get(`${PREFIX}/users/:userId`, async (c) => {
  try {
    const userId = c.req.param("userId");
    const user = await kv.get(`user:${userId}`);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const { passwordHash: _, ...safeUser } = user;
    return c.json({ user: safeUser });
  } catch (err) {
    console.log(`Error fetching user: ${err}`);
    return c.json({ error: `Failed to fetch user: ${err}` }, 500);
  }
});

// Get all users for discovery (excludes current user and already-interacted users)
app.get(`${PREFIX}/discover/:userId`, async (c) => {
  try {
    const userId = c.req.param("userId");

    // Fetch user list AND interactions in parallel (3 fast KV reads)
    const [userIds, sentList, rejectedList] = await Promise.all([
      kv.get("users:list").then((v: any) => v || []),
      kv.get(`friendify_sent:${userId}`).then((v: any) => v || []),
      kv.get(`rejected:${userId}`).then((v: any) => v || []),
    ]);

    // Filter out current user and already-interacted users BEFORE fetching profiles
    // This drastically reduces the number of profiles we need to read from the DB
    const excluded = new Set([userId, ...sentList, ...rejectedList]);
    const candidateIds = userIds.filter((id: string) => !excluded.has(id));

    if (candidateIds.length === 0) {
      return c.json({ users: [], interactions: { sent: sentList, rejected: rejectedList } });
    }

    // Fetch only the candidate profiles (mget handles batching internally)
    const userKeys = candidateIds.map((id: string) => `user:${id}`);
    const allUsers = await kv.mget(userKeys);

    // Filter for onboarded users and strip unnecessary fields to reduce payload
    const discoverable = allUsers
      .filter((u: any) => u && u.onboarded)
      .map((u: any) => ({
        id: u.id,
        name: u.name,
        age: u.age,
        city: u.city,
        almaMater: u.almaMater,
        gender: u.gender,
        funFact: u.funFact,
        lookingFor: u.lookingFor,
        hobbies: u.hobbies,
        profilePhoto: u.profilePhoto,
        hobbyPhotos: u.hobbyPhotos,
        personality: u.personality,
        lat: u.lat,
        lng: u.lng,
      }));

    // Return interactions alongside users so frontend doesn't need a separate API call
    return c.json({ users: discoverable, interactions: { sent: sentList, rejected: rejectedList } });
  } catch (err) {
    console.log(`Error fetching users for discovery: ${err}`);
    return c.json({ error: `Failed to fetch users: ${err}` }, 500);
  }
});

// ==================== FRIENDIFY & MATCHING ROUTES ====================

// Send a friendify (like)
app.post(`${PREFIX}/friendify`, async (c) => {
  try {
    const body = await c.req.json();
    const { fromUserId, toUserId } = body;

    if (!fromUserId || !toUserId) {
      return c.json({ error: "Missing fromUserId or toUserId" }, 400);
    }

    // Store the friendify action
    await kv.set(`friendify:${fromUserId}:${toUserId}`, {
      fromUserId,
      toUserId,
      timestamp: Date.now(),
    });

    // Add to the sender's sent list
    const sentList = (await kv.get(`friendify_sent:${fromUserId}`)) || [];
    if (!sentList.includes(toUserId)) {
      sentList.push(toUserId);
      await kv.set(`friendify_sent:${fromUserId}`, sentList);
    }

    // Add to the receiver's received list
    const receivedList = (await kv.get(`friendify_received:${toUserId}`)) || [];
    if (!receivedList.includes(fromUserId)) {
      receivedList.push(fromUserId);
      await kv.set(`friendify_received:${toUserId}`, receivedList);
    }

    // Check if the other person already friendified us (mutual match!)
    const reverseAction = await kv.get(`friendify:${toUserId}:${fromUserId}`);
    if (reverseAction) {
      // It's a match! Create a chat
      const chatId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      // Get both user profiles for chat metadata
      const fromUser = await kv.get(`user:${fromUserId}`);
      const toUser = await kv.get(`user:${toUserId}`);

      const chatData = {
        id: chatId,
        participants: [fromUserId, toUserId],
        participantNames: {
          [fromUserId]: fromUser?.name || "unknown",
          [toUserId]: toUser?.name || "unknown",
        },
        participantPhotos: {
          [fromUserId]: fromUser?.profilePhoto || null,
          [toUserId]: toUser?.profilePhoto || null,
        },
        messages: [],
        isNewMatch: true,
        matchedAt: Date.now(),
      };

      await kv.set(`chat:${chatId}`, chatData);

      // Add chat to both users' chat lists
      const fromChats = (await kv.get(`user_chats:${fromUserId}`)) || [];
      if (!fromChats.includes(chatId)) {
        fromChats.push(chatId);
        await kv.set(`user_chats:${fromUserId}`, fromChats);
      }

      const toChats = (await kv.get(`user_chats:${toUserId}`)) || [];
      if (!toChats.includes(chatId)) {
        toChats.push(chatId);
        await kv.set(`user_chats:${toUserId}`, toChats);
      }

      // Store match record
      await kv.set(`match:${fromUserId}:${toUserId}`, { chatId, matchedAt: Date.now() });
      await kv.set(`match:${toUserId}:${fromUserId}`, { chatId, matchedAt: Date.now() });

      console.log(`Match! ${fromUserId} <-> ${toUserId}, chat: ${chatId}`);
      return c.json({
        success: true,
        isMatch: true,
        chatId,
        matchedUserName: toUser?.name || "unknown",
      });
    }

    console.log(`Friendify sent: ${fromUserId} -> ${toUserId}`);
    return c.json({ success: true, isMatch: false });
  } catch (err) {
    console.log(`Error friendifying: ${err}`);
    return c.json({ error: `Failed to friendify: ${err}` }, 500);
  }
});

// Reject (bye) a user
app.post(`${PREFIX}/reject`, async (c) => {
  try {
    const body = await c.req.json();
    const { fromUserId, toUserId } = body;

    if (!fromUserId || !toUserId) {
      return c.json({ error: "Missing fromUserId or toUserId" }, 400);
    }

    // Store rejection
    const rejectedList = (await kv.get(`rejected:${fromUserId}`)) || [];
    if (!rejectedList.includes(toUserId)) {
      rejectedList.push(toUserId);
      await kv.set(`rejected:${fromUserId}`, rejectedList);
    }

    return c.json({ success: true });
  } catch (err) {
    console.log(`Error rejecting: ${err}`);
    return c.json({ error: `Failed to reject: ${err}` }, 500);
  }
});

// Get who friendified this user (premium feature)
app.get(`${PREFIX}/friendify/received/:userId`, async (c) => {
  try {
    const userId = c.req.param("userId");
    const receivedList = (await kv.get(`friendify_received:${userId}`)) || [];

    if (receivedList.length === 0) {
      return c.json({ users: [] });
    }

    // Batch fetch all user profiles at once instead of one-by-one (fixes N+1)
    const userKeys = receivedList.map((id: string) => `user:${id}`);
    const allUsers = await kv.mget(userKeys);

    const users = allUsers
      .filter((u: any) => u)
      .map((u: any) => {
        const { passwordHash: _, ...safe } = u;
        return safe;
      });

    return c.json({ users });
  } catch (err) {
    console.log(`Error fetching received friendifies: ${err}`);
    return c.json({ error: `Failed to fetch: ${err}` }, 500);
  }
});

// Get interactions for a user (who they've friendified and rejected)
app.get(`${PREFIX}/interactions/:userId`, async (c) => {
  try {
    const userId = c.req.param("userId");
    const sentList = (await kv.get(`friendify_sent:${userId}`)) || [];
    const rejectedList = (await kv.get(`rejected:${userId}`)) || [];

    return c.json({ sent: sentList, rejected: rejectedList });
  } catch (err) {
    console.log(`Error fetching interactions: ${err}`);
    return c.json({ error: `Failed to fetch interactions: ${err}` }, 500);
  }
});

// ==================== PREMIUM TRIAL ROUTES ====================

// Start a 48-hour premium trial
app.post(`${PREFIX}/premium/trial`, async (c) => {
  try {
    const body = await c.req.json();
    const { userId } = body;

    if (!userId) {
      return c.json({ error: "Missing userId" }, 400);
    }

    const user = await kv.get(`user:${userId}`);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Check if they already had a trial
    if (user.premiumTrialStart) {
      const trialEnd = user.premiumTrialStart + (48 * 60 * 60 * 1000);
      const now = Date.now();
      if (now > trialEnd && !user.premiumSubscribed) {
        return c.json({
          success: false,
          expired: true,
          message: "Your free trial has expired. Subscribe to continue using premium features.",
        });
      }
      // Trial still active or subscribed
      return c.json({
        success: true,
        alreadyActive: true,
        trialEnd,
        daysRemaining: Math.ceil((trialEnd - now) / (24 * 60 * 60 * 1000)),
      });
    }

    // Start new trial
    user.premium = true;
    user.premiumTrialStart = Date.now();
    await kv.set(`user:${userId}`, user);

    const trialEnd = user.premiumTrialStart + (48 * 60 * 60 * 1000);
    console.log(`Premium trial started for ${userId}`);
    return c.json({
      success: true,
      trialEnd,
      daysRemaining: 2,
    });
  } catch (err) {
    console.log(`Error starting trial: ${err}`);
    return c.json({ error: `Failed to start trial: ${err}` }, 500);
  }
});

// Check premium status
app.get(`${PREFIX}/premium/:userId`, async (c) => {
  try {
    const userId = c.req.param("userId");
    const user = await kv.get(`user:${userId}`);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    if (!user.premiumTrialStart) {
      return c.json({ isPremium: false, hasTrialed: false });
    }

    const trialEnd = user.premiumTrialStart + (48 * 60 * 60 * 1000);
    const now = Date.now();
    const isActive = now <= trialEnd || user.premiumSubscribed;

    // If trial expired and not subscribed, update the user record
    if (!isActive && user.premium) {
      user.premium = false;
      await kv.set(`user:${userId}`, user);
    }

    return c.json({
      isPremium: isActive,
      hasTrialed: true,
      trialEnd,
      daysRemaining: isActive ? Math.ceil((trialEnd - now) / (24 * 60 * 60 * 1000)) : 0,
      expired: !isActive,
    });
  } catch (err) {
    console.log(`Error checking premium: ${err}`);
    return c.json({ error: `Failed to check premium: ${err}` }, 500);
  }
});

// ==================== CHAT & MESSAGING ROUTES ====================

// Create a new chat (when a match happens)
app.post(`${PREFIX}/chats`, async (c) => {
  try {
    const body = await c.req.json();
    const { chatId, userId, matchedUserId, userName, userPhoto } = body;

    if (!chatId || !userId) {
      return c.json({ error: "Missing chatId or userId" }, 400);
    }

    const chatData = {
      id: chatId,
      participants: [userId, matchedUserId].filter(Boolean),
      participantNames: { [userId]: userName },
      participantPhotos: { [userId]: userPhoto },
      messages: [],
      isNewMatch: true,
      matchedAt: Date.now(),
    };

    await kv.set(`chat:${chatId}`, chatData);

    // Add chat ID to the user's chat list
    const userChats = (await kv.get(`user_chats:${userId}`)) || [];
    if (!userChats.includes(chatId)) {
      userChats.push(chatId);
      await kv.set(`user_chats:${userId}`, userChats);
    }

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
app.get(`${PREFIX}/chats/:userId`, async (c) => {
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
app.post(`${PREFIX}/messages`, async (c) => {
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

// Set typing status
app.post(`${PREFIX}/typing`, async (c) => {
  try {
    const body = await c.req.json();
    const { chatId, userId, isTyping } = body;
    if (!chatId || !userId) return c.json({ error: "Missing fields" }, 400);
    await kv.set(`typing:${chatId}:${userId}`, { isTyping, timestamp: Date.now() });
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: `Failed: ${err}` }, 500);
  }
});

// Get typing status for a chat
app.get(`${PREFIX}/typing/:chatId/:userId`, async (c) => {
  try {
    const chatId = c.req.param("chatId");
    const userId = c.req.param("userId");
    const data = await kv.get(`typing:${chatId}:${userId}`);
    // Consider typing expired after 5 seconds
    if (data && data.isTyping && (Date.now() - data.timestamp) < 5000) {
      return c.json({ isTyping: true });
    }
    return c.json({ isTyping: false });
  } catch {
    return c.json({ isTyping: false });
  }
});

// Mark messages as read
app.post(`${PREFIX}/messages/read`, async (c) => {
  try {
    const body = await c.req.json();
    const { chatId, userId } = body;
    if (!chatId || !userId) return c.json({ error: "Missing fields" }, 400);
    await kv.set(`read:${chatId}:${userId}`, { readAt: Date.now() });
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: `Failed: ${err}` }, 500);
  }
});

// Get read receipt for a chat
app.get(`${PREFIX}/messages/read/:chatId/:userId`, async (c) => {
  try {
    const chatId = c.req.param("chatId");
    const userId = c.req.param("userId");
    const data = await kv.get(`read:${chatId}:${userId}`);
    return c.json({ readAt: data?.readAt || null });
  } catch {
    return c.json({ readAt: null });
  }
});

// ==================== ACCOUNT DELETION ====================

// Delete user account and all associated data
app.delete(`${PREFIX}/users/:userId`, async (c) => {
  try {
    const userId = c.req.param("userId");
    const user = await kv.get(`user:${userId}`);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Remove email lookup
    if (user.email) {
      await kv.del(`user_email:${user.email}`);
    }

    // Remove friendify records
    const sentList = (await kv.get(`friendify_sent:${userId}`)) || [];
    for (const toId of sentList) {
      await kv.del(`friendify:${userId}:${toId}`);
      // Remove from their received list
      const theirReceived = (await kv.get(`friendify_received:${toId}`)) || [];
      const filtered = theirReceived.filter((id: string) => id !== userId);
      await kv.set(`friendify_received:${toId}`, filtered);
    }
    await kv.del(`friendify_sent:${userId}`);

    const receivedList = (await kv.get(`friendify_received:${userId}`)) || [];
    for (const fromId of receivedList) {
      await kv.del(`friendify:${fromId}:${userId}`);
      const theirSent = (await kv.get(`friendify_sent:${fromId}`)) || [];
      const filtered = theirSent.filter((id: string) => id !== userId);
      await kv.set(`friendify_sent:${fromId}`, filtered);
    }
    await kv.del(`friendify_received:${userId}`);

    // Handle chats - mark user as deleted in chats instead of deleting them
    const userChatIds = (await kv.get(`user_chats:${userId}`)) || [];
    for (const chatId of userChatIds) {
      const chat = await kv.get(`chat:${chatId}`);
      if (chat) {
        // Mark the deleted user in the chat
        if (chat.participantNames) {
          chat.participantNames[userId] = "[deleted account]";
        }
        if (chat.participantPhotos) {
          chat.participantPhotos[userId] = null;
        }
        chat.deletedParticipants = chat.deletedParticipants || [];
        chat.deletedParticipants.push(userId);
        await kv.set(`chat:${chatId}`, chat);
      }
    }
    await kv.del(`user_chats:${userId}`);

    // Remove rejection records
    await kv.del(`rejected:${userId}`);

    // Remove user from users list
    const usersList = (await kv.get("users:list")) || [];
    const updated = usersList.filter((id: string) => id !== userId);
    await kv.set("users:list", updated);

    // Delete user record
    await kv.del(`user:${userId}`);

    console.log(`Account deleted: ${userId}`);
    return c.json({ success: true });
  } catch (err) {
    console.log(`Error deleting account: ${err}`);
    return c.json({ error: `Failed to delete account: ${err}` }, 500);
  }
});

// Combined chat state: messages + typing + read receipt in one call
// Replaces 3 separate polling endpoints to reduce DB queries by 66%
app.get(`${PREFIX}/chat-state/:chatId/:userId`, async (c) => {
  try {
    const chatId = c.req.param("chatId");
    const userId = c.req.param("userId");

    const chat = await kv.get(`chat:${chatId}`);
    const otherId = chat?.participants?.find((id: string) => id !== userId);

    let isTyping = false;
    let readAt = null;

    if (otherId) {
      // Fetch typing status and read receipt in parallel
      const [typingData, readData] = await Promise.all([
        kv.get(`typing:${chatId}:${otherId}`),
        kv.get(`read:${chatId}:${otherId}`),
      ]);

      if (typingData?.isTyping && (Date.now() - typingData.timestamp) < 5000) {
        isTyping = true;
      }
      readAt = readData?.readAt || null;
    }

    return c.json({
      messages: chat?.messages || [],
      isTyping,
      readAt,
    });
  } catch {
    return c.json({ messages: [], isTyping: false, readAt: null });
  }
});

// Get messages for a chat
app.get(`${PREFIX}/messages/:chatId`, async (c) => {
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

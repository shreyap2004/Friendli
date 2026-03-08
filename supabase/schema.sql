-- Friendli App Database Schema
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vaqvxkjelzrzwbtdohsa/sql/new

-- KV Store table - stores all app data (users, chats, matches, etc.)
-- This is a simple key-value store used by the edge function backend.
CREATE TABLE IF NOT EXISTS kv_store_50b042b1 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

-- Key patterns used by the app:
--
-- USERS:
--   user:{userId}              -> Full user profile (name, email, age, hobbies, photos, etc.)
--   user_email:{email}         -> Maps email to userId for login lookup
--
-- FRIENDIFY (likes):
--   friendify:{fromId}:{toId}  -> Record of one user friendifying another
--   friendify_sent:{userId}    -> Array of user IDs this user has friendified
--   friendify_received:{userId}-> Array of user IDs who friendified this user
--
-- REJECTIONS:
--   rejected:{userId}          -> Array of user IDs this user has rejected (bye'd)
--
-- MATCHES:
--   match:{userA}:{userB}      -> Match record with chatId and timestamp
--
-- CHATS & MESSAGES:
--   chat:{chatId}              -> Chat object with participants, messages array, metadata
--   user_chats:{userId}        -> Array of chatIds this user is part of

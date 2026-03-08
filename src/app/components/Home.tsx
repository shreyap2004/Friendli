import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Heart, X, Crown, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Photo {
  url: string;
  activity: string;
}

interface Profile {
  id: string;
  name: string;
  age: number;
  photos: Photo[];
  lookingFor: string;
  profilePic: string;
}

// Large pool of hobby photos
const HOBBY_PHOTOS: Photo[] = [
  { url: "https://images.unsplash.com/photo-1653484596285-7f842613a023?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwaGlraW5nJTIwbW91bnRhaW4lMjB0cmFpbHxlbnwxfHx8fDE3NzI4NTQ2NjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", activity: "hiking" },
  { url: "https://images.unsplash.com/photo-1765966871032-7fe67d208761?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMG1hbiUyMGNvb2tpbmclMjBraXRjaGVufGVufDF8fHx8MTc3Mjg1NDY2NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", activity: "cooking" },
  { url: "https://images.unsplash.com/photo-1607702705816-81497b0a9009?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHJlYWRpbmclMjBib29rJTIwY2FmZXxlbnwxfHx8fDE3NzI4NTQ2NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", activity: "reading" },
  { url: "https://images.unsplash.com/photo-1610556301408-ce85ceb83861?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwbGF5aW5nJTIwZ3VpdGFyJTIwbXVzaWN8ZW58MXx8fHwxNzcyODQ0NTYwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", activity: "music" },
  { url: "https://images.unsplash.com/photo-1758274526138-4da003a5a936?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHlvZ2ElMjBvdXRkb29ycyUyMHBhcmt8ZW58MXx8fHwxNzcyODU0NjY2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", activity: "yoga" },
  { url: "https://images.unsplash.com/photo-1587819103231-f56107f62ad8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMG1hbiUyMHRyYXZlbGluZyUyMGJhY2twYWNrJTIwY2l0eXxlbnwxfHx8fDE3NzI4NTQ2Njd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", activity: "traveling" },
  { url: "https://images.unsplash.com/photo-1635098995751-5fcc485996d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBhaW50aW5nJTIwYXJ0JTIwc3R1ZGlvfGVufDF8fHx8MTc3Mjg0ODY3NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", activity: "art" },
  { url: "https://images.unsplash.com/photo-1729281008800-539686eaedc0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBmaXRuZXNzJTIwZ3lmJTIwd29ya291dHxlbnwxfHx8fDE3NzI4NTQ2Njd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", activity: "fitness" },
  { url: "https://images.unsplash.com/photo-1766867245104-5c1d8f1aabc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBob3RvZ3JhcGh5JTIwY2FtZXJhJTIwb3V0ZG9vcnN8ZW58MXx8fHwxNzcyODU0NjY4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", activity: "photography" },
  { url: "https://images.unsplash.com/photo-1753351050724-511764d227e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMG1hbiUyMGNvZmZlZSUyMHNob3AlMjBzbWlsaW5nfGVufDF8fHx8MTc3Mjg1NDY2OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", activity: "coffee" },
  { url: "https://images.unsplash.com/photo-1763630051876-928346788268?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGRhbmNpbmclMjBzYWxzYSUyMGNsdWJ8ZW58MXx8fHwxNzcyODU0NjY5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", activity: "dancing" },
  { url: "https://images.unsplash.com/photo-1725563128279-6ae63e46dc9d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjByb2NrJTIwY2xpbWJpbmclMjBib3VsZGVyaW5nfGVufDF8fHx8MTc3Mjg1NDY2OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", activity: "climbing" },
  { url: "https://images.unsplash.com/photo-1623222316492-d7bddd11a0de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHJ1bm5pbmclMjBqb2dnaW5nJTIwdHJhaWx8ZW58MXx8fHwxNzcyODU0NjY5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", activity: "running" },
  { url: "https://images.unsplash.com/photo-1660020140973-4a18a4b46d14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBzdXJmaW5nJTIwb2NlYW4lMjB3YXZlc3xlbnwxfHx8fDE3NzI4NTQ2NzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", activity: "surfing" },
  { url: "https://images.unsplash.com/photo-1627662057514-f15bc58cc179?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGJha2luZyUyMHBhc3RyaWVzJTIwa2l0Y2hlbnxlbnwxfHx8fDE3NzI4NTQ2NzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", activity: "baking" },
  { url: "https://images.unsplash.com/photo-1627837661889-6fc9434e12f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBza2F0ZWJvYXJkaW5nJTIwcGFyayUyMHVyYmFufGVufDF8fHx8MTc3Mjg1NDY3MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", activity: "skateboarding" },
  { url: "https://images.unsplash.com/photo-1761839257513-a921710a4291?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGdhcmRlbmluZyUyMGZsb3dlcnMlMjBvdXRkb29yfGVufDF8fHx8MTc3Mjg1NDY3MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", activity: "gardening" },
  { url: "https://images.unsplash.com/photo-1762770646079-16a8fff60012?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwbGF5aW5nJTIwYmFza2V0YmFsbCUyMGNvdXJ0fGVufDF8fHx8MTc3Mjg1NDY3MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", activity: "basketball" },
  { url: "https://images.unsplash.com/photo-1550592704-6c76defa9985?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHdyaXRpbmclMjBqb3VybmFsJTIwbm90ZWJvb2t8ZW58MXx8fHwxNzcyODU0NjcyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", activity: "writing" },
  { url: "https://images.unsplash.com/photo-1633431305692-00a2f1a5c3d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBjYW1waW5nJTIwdGVudCUyMG5hdHVyZXxlbnwxfHx8fDE3NzI4NTQ2NzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", activity: "camping" },
  { url: "https://images.unsplash.com/photo-1681295687070-f138b5aa2b1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGN5Y2xpbmclMjBiaWN5Y2xlJTIwcm9hZHxlbnwxfHx8fDE3NzI4NTQ2NzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", activity: "cycling" },
  { url: "https://images.unsplash.com/photo-1772487489049-42159a5cdcbb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3R0ZXJ5JTIwY2VyYW1pY3MlMjBjcmFmdGluZ3xlbnwxfHx8fDE3NzI4NTQ2NzN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", activity: "pottery" },
  { url: "https://images.unsplash.com/photo-1758657209554-fa7c83d10f89?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHN3aW1taW5nJTIwcG9vbCUyMHNwb3J0fGVufDF8fHx8MTc3Mjg1NDY3M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", activity: "swimming" },
  { url: "https://images.unsplash.com/photo-1758599668429-121d54188b9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjB2b2x1bnRlZXJpbmclMjBjb21tdW5pdHklMjBzZXJ2aWNlfGVufDF8fHx8MTc3Mjg1NDY3M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", activity: "volunteering" },
  { url: "https://images.unsplash.com/photo-1758598738260-4893695cead9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBsYXlpbmclMjB2aWRlbyUyMGdhbWVzJTIwY29udHJvbGxlcnxlbnwxfHx8fDE3NzI4NTQ2NzR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", activity: "gaming" },
];

// Profile picture pool
const PROFILE_PICS = [
  "https://images.unsplash.com/photo-1762522921456-cdfe882d36c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwcG9ydHJhaXQlMjBoZWFkc2hvdCUyMHNtaWxpbmd8ZW58MXx8fHwxNzcyODU0Njc0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1628619487925-e9b8fc4c6b08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMG1hbiUyMHBvcnRyYWl0JTIwaGVhZHNob3QlMjBjYXN1YWx8ZW58MXx8fHwxNzcyODQ4Nzc2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1770922808025-1c3b13a37679?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0JTIwZ3JhZHVhdGUlMjBzdHVkZW50fGVufDF8fHx8MTc3Mjg1NDY3NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1532272278764-53cd1fe53f72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdCUyMHByb2Zlc3Npb25hbCUyMHlvdW5nfGVufDF8fHx8MTc3Mjg1NDY3Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1671766013225-2883b2b994ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0JTIwY2FzdWFsJTIwb3V0ZG9vciUyMHNtaWxlfGVufDF8fHx8MTc3Mjg1NDY3Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1764816657425-b3c79b616d14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdCUyMGZyaWVuZGx5JTIwb3V0ZG9vcnxlbnwxfHx8fDE3NzI4NTQ2NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1643700419516-6294a9c41ab8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0JTIwc2VsZmllJTIwdXJiYW58ZW58MXx8fHwxNzcyODU0Njc3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1758874574397-e56dfcfc116d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdCUyMHNtaWxlJTIwY29uZmlkZW50fGVufDF8fHx8MTc3Mjg1NDY3N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1714730772839-3eb86740bf26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0JTIwd2FybSUyMG5hdHVyYWwlMjBsaWdodHxlbnwxfHx8fDE3NzI4NTQ2Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1767647983941-f8d8a8ab9d55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdCUyMGNhc3VhbCUyMGNvb2wlMjBzdHlsZXxlbnwxfHx8fDE3NzI4NTQ2Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
];

const NAMES = [
  "emma", "liam", "sophia", "noah", "olivia",
  "james", "ava", "ethan", "mia", "lucas",
  "charlotte", "mason", "harper", "ben", "lily"
];

const LOOKING_FOR = [
  "looking for someone to grab coffee and explore the city with on weekends!",
  "hoping to find a hiking buddy who's down for trail adventures and good conversations",
  "want a gym partner who also loves trying new restaurants afterwards",
  "searching for a creative soul to visit galleries, make art, and share playlists with",
  "need a study buddy who also knows how to have fun - board games, anyone?",
  "looking for fellow foodies who want to cook together and try new cuisines",
  "want to find someone to explore live music, open mics, and hidden gem cafes",
  "hoping to meet people who love outdoor adventures - camping, kayaking, you name it!",
  "searching for a travel buddy to plan weekend getaways and spontaneous road trips",
  "looking for genuine friendships - someone to laugh with over brunch and late-night talks",
  "want a running buddy who's also into brunch and chill netflix nights",
  "looking for someone who's into volunteering and making a difference together",
  "need a friend who loves both cozy book clubs and wild dance nights",
  "searching for someone to share pottery classes and farmers market mornings with",
  "hoping to find a fellow grad student who gets the struggle and wants to have fun too",
];

// Seeded random for consistent but varied results
function seededRandom(seed: number) {
  let s = seed + 100000;
  // Warm up the generator
  for (let i = 0; i < 5; i++) {
    s = (s * 16807) % 2147483647;
  }
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateProfiles(): Profile[] {
  const profiles: Profile[] = [];
  for (let i = 0; i < 50; i++) {
    const rand = seededRandom(i * 7 + 42);
    // Each profile gets 1-8 random hobby photos
    const photoCount = Math.floor(rand() * 8) + 1; // 1 to 8
    const shuffled = [...HOBBY_PHOTOS].sort(() => rand() - 0.5);
    const photos = shuffled.slice(0, photoCount);

    profiles.push({
      id: `profile-${i}`,
      name: NAMES[i % NAMES.length],
      age: Math.floor(rand() * 10) + 22,
      photos,
      lookingFor: LOOKING_FOR[i % LOOKING_FOR.length],
      profilePic: PROFILE_PICS[i % PROFILE_PICS.length],
    });
  }
  return profiles;
}

const DAILY_REC_LIMIT = 10;

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

interface DailyRecsData {
  date: string;
  profileIds: string[];
}

function getDailyRecs(allProfiles: Profile[]): Profile[] {
  const isPremium = localStorage.getItem("friendli_premium") === "true";
  if (isPremium) return allProfiles;

  const today = getTodayString();
  const storedRaw = localStorage.getItem("friendli_daily_recs");
  let stored: DailyRecsData | null = null;

  if (storedRaw) {
    try { stored = JSON.parse(storedRaw); } catch { stored = null; }
  }

  // If we already have recs for today, return those
  if (stored && stored.date === today) {
    return stored.profileIds
      .map((id) => allProfiles.find((p) => p.id === id))
      .filter(Boolean) as Profile[];
  }

  // New day — pick 10 new profiles
  // Get all previously shown profile IDs across all days
  const historyRaw = localStorage.getItem("friendli_shown_history");
  let shownHistory: string[] = [];
  if (historyRaw) {
    try { shownHistory = JSON.parse(historyRaw); } catch { shownHistory = []; }
  }

  // Filter to profiles not yet shown
  let available = allProfiles.filter((p) => !shownHistory.includes(p.id));

  // If we've exhausted all profiles, reset the history
  if (available.length < DAILY_REC_LIMIT) {
    shownHistory = [];
    localStorage.setItem("friendli_shown_history", JSON.stringify([]));
    available = allProfiles;
  }

  // Shuffle available using today's date as seed for consistent daily order
  const daySeed = today.split("-").reduce((acc, v) => acc + parseInt(v), 0);
  const dayRand = seededRandom(daySeed);
  const shuffled = [...available].sort(() => dayRand() - 0.5);
  const dailyPicks = shuffled.slice(0, DAILY_REC_LIMIT);
  const dailyIds = dailyPicks.map((p) => p.id);

  // Save today's recs
  localStorage.setItem("friendli_daily_recs", JSON.stringify({ date: today, profileIds: dailyIds }));

  // Update shown history
  const newHistory = [...shownHistory, ...dailyIds];
  localStorage.setItem("friendli_shown_history", JSON.stringify(newHistory));

  return dailyPicks;
}

function PhotoCarousel({ photos }: { photos: Photo[] }) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < photos.length) setCurrent(index);
  }, [photos.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const diff = touchStartX.current - touchEndX.current;
      if (diff > 50) goTo(current + 1);
      if (diff < -50) goTo(current - 1);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) {
      goTo(current - 1);
    } else {
      goTo(current + 1);
    }
  };

  if (photos.length === 1) {
    return (
      <div className="relative">
        <div className="aspect-square relative overflow-hidden">
          <img
            src={photos[0].url}
            alt={photos[0].activity}
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute bottom-3 right-3 bg-[#EE964B] text-white px-4 py-1.5 rounded-full shadow-lg lowercase font-bold text-sm">
            {photos[0].activity}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Instagram-style progress bars */}
      <div className="absolute top-2 left-2 right-2 z-10 flex gap-1">
        {photos.map((_, i) => (
          <div key={i} className="flex-1 h-[3px] rounded-full bg-white/35 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${i <= current ? 'bg-white w-full' : 'w-0'}`}
            />
          </div>
        ))}
      </div>

      {/* Photo */}
      <div
        className="aspect-square relative overflow-hidden cursor-pointer select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        <img
          src={photos[current].url}
          alt={photos[current].activity}
          className="w-full h-full object-cover transition-opacity duration-200"
          draggable={false}
        />
        {/* Activity bubble */}
        <div className="absolute bottom-3 right-3 bg-[#EE964B] text-white px-4 py-1.5 rounded-full shadow-lg lowercase font-bold text-sm">
          {photos[current].activity}
        </div>

        {/* Left arrow */}
        {current > 0 && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center">
            <ChevronLeft size={20} className="text-white" />
          </div>
        )}
        {/* Right arrow */}
        {current < photos.length - 1 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center">
            <ChevronRight size={20} className="text-white" />
          </div>
        )}
      </div>

      {/* Photo counter */}
      <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs font-bold px-2.5 py-1 rounded-full">
        {current + 1}/{photos.length}
      </div>
    </div>
  );
}

function ProfileCard({ profile, onFriendify, onBye, isInteracted }: { 
  profile: Profile; 
  onFriendify: () => void; 
  onBye: () => void;
  isInteracted: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-opacity ${isInteracted ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Header with profile pic, name, age */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <img 
          src={profile.profilePic} 
          alt={profile.name}
          className="w-11 h-11 rounded-full object-cover border-2 border-[#EE964B]"
        />
        <div>
          <h3 className="text-base font-bold text-[#0D3B66] lowercase">{profile.name}, {profile.age}</h3>
        </div>
      </div>

      {/* Image carousel with activity labels */}
      <PhotoCarousel photos={profile.photos} />

      {/* Looking for section */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-[#0D3B66] text-sm lowercase leading-relaxed font-medium">{profile.lookingFor}</p>
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-4 pt-2 flex gap-3">
        <Button
          onClick={onBye}
          className="flex-1 bg-[#E8556D] hover:bg-[#C51E3A] text-white lowercase py-5 text-sm font-bold"
        >
          <X className="mr-1.5" size={18} />
          bye
        </Button>
        <Button
          onClick={onFriendify}
          className="flex-1 bg-[#EE964B] hover:bg-[#F95738] text-white lowercase py-5 text-sm font-bold"
        >
          <Heart className="mr-1.5" size={18} />
          friendify
        </Button>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [rejectedProfiles, setRejectedProfiles] = useState<string[]>([]);
  const [friendifiedProfiles, setFriendifiedProfiles] = useState<string[]>([]);
  const [allProfiles] = useState<Profile[]>(() => generateProfiles());
  const [dailyProfiles, setDailyProfiles] = useState<Profile[]>([]);
  const currentUser = JSON.parse(localStorage.getItem('friendli_user') || '{}');

  const isPremium = localStorage.getItem("friendli_premium") === "true";

  useEffect(() => {
    const saved = localStorage.getItem("friendli_rejected");
    if (saved) setRejectedProfiles(JSON.parse(saved));
    const savedFriends = localStorage.getItem("friendli_friendified");
    if (savedFriends) setFriendifiedProfiles(JSON.parse(savedFriends));
    // Load daily recs
    setDailyProfiles(getDailyRecs(allProfiles));
  }, [allProfiles]);

  const handleBye = (profileId: string) => {
    const updated = [...rejectedProfiles, profileId];
    setRejectedProfiles(updated);
    localStorage.setItem("friendli_rejected", JSON.stringify(updated));
    toast("bye! maybe next time", { duration: 1500 });
  };

  const handleFriendify = (profileId: string, name: string) => {
    const updated = [...friendifiedProfiles, profileId];
    setFriendifiedProfiles(updated);
    localStorage.setItem("friendli_friendified", JSON.stringify(updated));

    // Check for match (50% chance for demo)
    const isMatch = Math.random() > 0.5;
    if (isMatch) {
      const matches = JSON.parse(localStorage.getItem("friendli_matches") || "[]");
      matches.push({ profileId, name, timestamp: Date.now() });
      localStorage.setItem("friendli_matches", JSON.stringify(matches));

      // Create a chat entry for this match
      const profile = allProfiles.find(p => p.id === profileId);
      const chats = JSON.parse(localStorage.getItem("friendli_chats") || "[]");
      const chatExists = chats.some((c: { userId: string }) => c.userId === profileId);
      if (!chatExists && profile) {
        const newChat = {
          id: `chat-${Date.now()}`,
          userId: profileId,
          userName: name,
          userPhoto: profile.profilePic,
          messages: [],
          isNewMatch: true,
          matchedAt: Date.now(),
        };
        chats.push(newChat);
        localStorage.setItem("friendli_chats", JSON.stringify(chats));

        // Also persist to server
        fetch(`https://vaqvxkjelzrzwbtdohsa.supabase.co/functions/v1/make-server-50b042b1/chats`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhcXZ4a2plbHpyendidGRvaHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NDU5NzQsImV4cCI6MjA4ODQyMTk3NH0.JzR5ankoUQtOg-uZSgJwsACFlI1eS8j0NRN4HNa4144`,
          },
          body: JSON.stringify({
            chatId: newChat.id,
            userId: currentUser.id,
            matchedUserId: profileId,
            userName: name,
            userPhoto: profile.profilePic,
          }),
        }).catch((err) => console.log("Error persisting chat to server:", err));
      }

      toast(`it's a match! you and ${name} are now friends!`, {
        duration: 3000,
        style: { background: "#EE964B", color: "white", fontWeight: "bold" },
      });
    } else {
      toast(`friendify sent to ${name}!`, { duration: 1500 });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FDFAEC]">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-extrabold text-[#0D3B66] lowercase">discover</h1>
      </div>

      {/* Scrollable profile cards */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {dailyProfiles.map((profile) => {
          const isInteracted = rejectedProfiles.includes(profile.id) || friendifiedProfiles.includes(profile.id);
          return (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onBye={() => handleBye(profile.id)}
              onFriendify={() => handleFriendify(profile.id, profile.name)}
              isInteracted={isInteracted}
            />
          );
        })}

        {/* Daily limit footer — only shown for free users */}
        {!isPremium && dailyProfiles.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <Crown className="mx-auto mb-3 text-[#F4D35E]" size={36} />
            <h3 className="text-lg font-extrabold text-[#0D3B66] lowercase mb-1">
              you've reached your daily limit
            </h3>
            <p className="text-sm text-[#0D3B66]/60 lowercase font-medium mb-4">
              come back tomorrow for 10 new recommendations, or upgrade to friendli+ for unlimited discovery!
            </p>
            <Button
              onClick={() => navigate("/settings")}
              className="w-full bg-gradient-to-r from-[#EE964B] to-[#F95738] hover:opacity-90 text-white font-black lowercase py-3"
            >
              <Crown className="mr-2" size={16} />
              upgrade to friendli+
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
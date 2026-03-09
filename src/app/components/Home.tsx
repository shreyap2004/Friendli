import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Heart, X, Crown, ChevronLeft, ChevronRight, Filter,
  Sparkles, Loader2, Users, SlidersHorizontal, Eye,
  RefreshCw, Search, MapPin, Coffee
} from "lucide-react";
import { toast } from "sonner";
import * as api from "@/lib/api";
import { getDistanceMiles } from "@/lib/geo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { motion, AnimatePresence } from "motion/react";

interface UserProfile {
  id: string;
  name: string;
  age: string;
  city: string;
  almaMater: string;
  gender: string;
  funFact: string;
  lookingFor: string;
  hobbies: string[];
  profilePhoto: string;
  hobbyPhotos: Record<string, string>;
  personality: string;
  lat: number | null;
  lng: number | null;
}

/* ─── Match Celebration Component ─── */
function MatchCelebration({ matchName, onDismiss }: { matchName: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const confettiPieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.5,
    duration: 1.5 + Math.random() * 2,
    size: 6 + Math.random() * 10,
    color: ["#EE964B", "#F4D35E", "#E8556D", "#0D3B66", "#F95738", "#4CAF50", "#9C27B0"][i % 7],
  }));

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDismiss}
    >
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes confettiSway {
          0%, 100% { margin-left: 0; }
          50% { margin-left: 30px; }
        }
        .confetti-piece {
          position: absolute;
          top: -20px;
          border-radius: 50%;
          animation: confettiFall var(--fall-duration) ease-in var(--fall-delay) forwards,
                     confettiSway 2s ease-in-out var(--fall-delay) infinite;
        }
      `}</style>

      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            "--fall-delay": `${piece.delay}s`,
            "--fall-duration": `${piece.duration}s`,
          } as React.CSSProperties}
        />
      ))}

      <motion.div
        className="bg-white rounded-3xl p-8 mx-6 text-center shadow-2xl max-w-sm w-full relative z-10"
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.3, opacity: 0 }}
        transition={{ type: "spring", damping: 15, stiffness: 200 }}
      >
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Sparkles className="mx-auto mb-3 text-[#F4D35E]" size={52} />
        </motion.div>
        <h2 className="text-2xl font-black text-[#0D3B66] lowercase mb-2">it&apos;s a match!</h2>
        <p className="text-[#EE964B] font-bold text-lg lowercase mb-1">you and {matchName} are now friends!</p>
        <p className="text-sm text-[#0D3B66]/50 lowercase font-medium">tap anywhere to dismiss</p>
      </motion.div>
    </motion.div>
  );
}

/* ─── Photo Carousel ─── */
function PhotoCarousel({ photos }: { photos: { url: string; label: string }[] }) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < photos.length) setCurrent(index);
  }, [photos.length]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.targetTouches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.targetTouches[0].clientX; };
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
    if (x < rect.width / 2) goTo(current - 1);
    else goTo(current + 1);
  };

  if (photos.length === 0) {
    return (
      <div className="aspect-square bg-[#FDFAEC] flex items-center justify-center">
        <Users size={48} className="text-[#0D3B66]/20" />
      </div>
    );
  }

  if (photos.length === 1) {
    return (
      <div className="relative">
        <div className="aspect-square relative overflow-hidden">
          <img src={photos[0].url} alt={photos[0].label} className="w-full h-full object-cover" draggable={false} />
          {photos[0].label && (
            <div className="absolute bottom-3 right-3 bg-[#EE964B] text-white px-4 py-1.5 rounded-full shadow-lg lowercase font-bold text-sm">
              {photos[0].label}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-2 left-2 right-2 z-10 flex gap-1">
        {photos.map((_, i) => (
          <div key={i} className="flex-1 h-[3px] rounded-full bg-white/35 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${i <= current ? "bg-white w-full" : "w-0"}`} />
          </div>
        ))}
      </div>
      <div
        className="aspect-square relative overflow-hidden cursor-pointer select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        <img src={photos[current].url} alt={photos[current].label} className="w-full h-full object-cover transition-opacity duration-200" draggable={false} />
        {photos[current].label && photos[current].url && (
          <div className="absolute bottom-3 right-3 bg-[#EE964B] text-white px-4 py-1.5 rounded-full shadow-lg lowercase font-bold text-sm">
            {photos[current].label}
          </div>
        )}
        {current > 0 && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center">
            <ChevronLeft size={20} className="text-white" />
          </div>
        )}
        {current < photos.length - 1 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center">
            <ChevronRight size={20} className="text-white" />
          </div>
        )}
      </div>
      <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs font-bold px-2.5 py-1 rounded-full">
        {current + 1}/{photos.length}
      </div>
    </div>
  );
}

/* ─── Profile Card ─── */
function ProfileCard({ user, onFriendify, onBye, isInteracted, commonHobbiesCount, currentUserLat, currentUserLng }: {
  user: UserProfile;
  onFriendify: () => void;
  onBye: () => void;
  isInteracted: boolean;
  commonHobbiesCount: number;
  currentUserLat?: number | null;
  currentUserLng?: number | null;
}) {
  const photos: { url: string; label: string }[] = [];
  if (user.profilePhoto) photos.push({ url: user.profilePhoto, label: "" });
  // Only show hobbies that have photos in the carousel
  if (user.hobbyPhotos) {
    for (const [hobby, url] of Object.entries(user.hobbyPhotos)) {
      if (url) photos.push({ url, label: hobby });
    }
  }

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-opacity ${isInteracted ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        {user.profilePhoto ? (
          <img src={user.profilePhoto} alt={user.name} className="w-11 h-11 rounded-full object-cover border-2 border-[#EE964B]" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-[#EE964B]/20 flex items-center justify-center border-2 border-[#EE964B]">
            <span className="text-[#EE964B] font-bold text-lg">{user.name?.[0]?.toUpperCase() || "?"}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-[#0D3B66] lowercase">{user.name}, {user.age}</h3>
          <p className="text-xs text-[#0D3B66]/50 lowercase font-medium">{user.city}{user.almaMater ? ` - ${user.almaMater}` : ""}</p>
          {currentUserLat && currentUserLng && user.lat && user.lng && (
            <p className="text-[10px] text-[#EE964B] lowercase font-semibold">
              {Math.round(getDistanceMiles(currentUserLat, currentUserLng, user.lat, user.lng))} miles away
            </p>
          )}
        </div>
        {commonHobbiesCount > 0 && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#4CAF50]/10 border border-[#4CAF50]/20 shrink-0">
            <Sparkles size={12} className="text-[#4CAF50]" />
            <span className="text-[#4CAF50] text-xs font-bold lowercase">{commonHobbiesCount} {commonHobbiesCount === 1 ? "hobby" : "hobbies"} in common</span>
          </div>
        )}
      </div>

      {photos.length > 0 && <PhotoCarousel photos={photos} />}

      {user.hobbies && user.hobbies.length > 0 && (
        <div className="px-4 pt-2 flex flex-wrap gap-1.5">
          {user.hobbies.slice(0, 6).map((hobby) => (
            <span key={hobby} className="px-2.5 py-1 rounded-full bg-[#EE964B]/10 text-[#EE964B] text-xs lowercase font-semibold">
              {hobby}
            </span>
          ))}
          {user.hobbies.length > 6 && (
            <span className="px-2.5 py-1 rounded-full bg-[#0D3B66]/5 text-[#0D3B66]/50 text-xs lowercase font-semibold">
              +{user.hobbies.length - 6} more
            </span>
          )}
        </div>
      )}

      <div className="px-4 pt-3 pb-2">
        <p className="text-[#0D3B66] text-sm lowercase leading-relaxed font-medium">{user.lookingFor}</p>
      </div>

      {user.funFact && (
        <div className="px-4 pb-2">
          <p className="text-xs text-[#0D3B66]/60 lowercase font-medium italic">fun fact: {user.funFact}</p>
        </div>
      )}

      <div className="px-4 pb-4 pt-2 flex gap-3">
        <Button onClick={onBye} className="flex-1 bg-[#E8556D] hover:bg-[#C51E3A] text-white lowercase py-5 text-sm font-bold">
          <X className="mr-1.5" size={18} /> bye
        </Button>
        <Button onClick={onFriendify} className="flex-1 bg-[#EE964B] hover:bg-[#F95738] text-white lowercase py-5 text-sm font-bold">
          <Heart className="mr-1.5" size={18} /> friendify
        </Button>
      </div>
    </div>
  );
}

interface Filters {
  ageMin: string;
  ageMax: string;
  city: string;
  hobbies: string[];
  personality: string;
  radius: string;
}

export default function Home() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [interactedIds, setInteractedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showWhoLikedYou, setShowWhoLikedYou] = useState(false);
  const [whoLikedYou, setWhoLikedYou] = useState<UserProfile[]>([]);
  const [filters, setFilters] = useState<Filters>({ ageMin: "", ageMax: "", city: "", hobbies: [], personality: "", radius: "" });
  const currentUser = api.getCurrentUser();
  const [premiumStatus, setPremiumStatus] = useState<{ isPremium: boolean; daysRemaining: number }>(() => {
    // Initialize from localStorage (instant, no API call needed)
    const user = api.getCurrentUser();
    if (user?.premiumTrialStart) {
      const trialEnd = user.premiumTrialStart + (48 * 60 * 60 * 1000);
      const isActive = Date.now() <= trialEnd || user.premiumSubscribed;
      return { isPremium: isActive, daysRemaining: isActive ? Math.ceil((trialEnd - Date.now()) / (24 * 60 * 60 * 1000)) : 0 };
    }
    return { isPremium: false, daysRemaining: 0 };
  });

  // Slide-out animation state
  const [slidingOut, setSlidingOut] = useState<{ id: string; direction: "left" | "right" } | null>(null);

  // Match celebration state
  const [matchCelebration, setMatchCelebration] = useState<{ name: string } | null>(null);

  // Pull-to-refresh state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pullStartY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const isPulling = useRef(false);

  const DAILY_REC_LIMIT = 10;
  const PULL_THRESHOLD = 80;

  useEffect(() => {
    loadData();
  }, []);

  // Cache discover data for 30 seconds to avoid re-fetching on tab switches
  const discoverCacheRef = useRef<{ data: unknown; time: number } | null>(null);

  const loadData = async () => {
    if (!currentUser) return;

    // Use cached data if less than 30 seconds old
    const cache = discoverCacheRef.current;
    if (cache && Date.now() - cache.time < 30000 && !refreshing) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [discoverResult, interactionsResult, premiumResult] = await Promise.all([
        api.discoverUsers(currentUser.id),
        api.getInteractions(currentUser.id),
        api.checkPremium(currentUser.id).catch(() => ({ isPremium: false, daysRemaining: 0 })),
      ]);

      discoverCacheRef.current = { data: true, time: Date.now() };

      setPremiumStatus(premiumResult);

      const interacted = new Set<string>([
        ...(interactionsResult.sent || []),
        ...(interactionsResult.rejected || []),
      ]);
      setInteractedIds(interacted);

      const available = (discoverResult.users || []).filter(
        (u: UserProfile) => !interacted.has(u.id)
      );
      setUsers(available);
    } catch (err) {
      console.error("Error loading discover:", err);
      toast.error("failed to load profiles");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    toast("profiles refreshed!", { duration: 1500 });
  };

  // Pull-to-refresh handlers
  const handlePullTouchStart = (e: React.TouchEvent) => {
    const container = scrollContainerRef.current;
    if (container && container.scrollTop <= 0) {
      pullStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  };

  const handlePullTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current || pullStartY.current === null) return;
    const container = scrollContainerRef.current;
    if (container && container.scrollTop > 0) {
      isPulling.current = false;
      setPullDistance(0);
      return;
    }
    const diff = e.touches[0].clientY - pullStartY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 120));
    }
  };

  const handlePullTouchEnd = () => {
    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      handleRefresh();
    }
    pullStartY.current = null;
    isPulling.current = false;
    setPullDistance(0);
  };

  const getCommonHobbiesCount = (userHobbies: string[]): number => {
    if (!currentUser?.hobbies || !userHobbies) return 0;
    return userHobbies.filter((h) => currentUser.hobbies.includes(h)).length;
  };

  const getFilteredUsers = (): UserProfile[] => {
    let filtered = users;

    if (filters.ageMin) filtered = filtered.filter(u => parseInt(u.age) >= parseInt(filters.ageMin));
    if (filters.ageMax) filtered = filtered.filter(u => parseInt(u.age) <= parseInt(filters.ageMax));
    if (filters.city) filtered = filtered.filter(u => u.city?.toLowerCase().includes(filters.city.toLowerCase()));
    if (filters.radius && currentUser?.lat && currentUser?.lng) {
      const maxMiles = parseInt(filters.radius);
      if (!isNaN(maxMiles)) {
        filtered = filtered.filter(u => {
          if (!u.lat || !u.lng) return true; // include users without location
          return getDistanceMiles(currentUser.lat, currentUser.lng, u.lat, u.lng) <= maxMiles;
        });
      }
    }
    if (filters.hobbies.length > 0) {
      filtered = filtered.filter(u => u.hobbies && filters.hobbies.some(h => u.hobbies.includes(h)));
    }
    if (filters.personality && filters.personality !== "no preference") {
      filtered = filtered.filter(u => u.personality === filters.personality);
    }

    // Priority matching for premium: sort by hobby overlap
    if (premiumStatus.isPremium && currentUser?.hobbies) {
      filtered = [...filtered].sort((a, b) => {
        const aOverlap = a.hobbies?.filter((h: string) => currentUser.hobbies.includes(h)).length || 0;
        const bOverlap = b.hobbies?.filter((h: string) => currentUser.hobbies.includes(h)).length || 0;
        return bOverlap - aOverlap;
      });
    }

    if (!premiumStatus.isPremium) filtered = filtered.slice(0, DAILY_REC_LIMIT);
    return filtered;
  };

  const handleFriendify = async (userId: string) => {
    if (!currentUser) return;
    try {
      // Animate slide out to the right
      setSlidingOut({ id: userId, direction: "right" });
      await new Promise((resolve) => setTimeout(resolve, 300));

      setSlidingOut(null);
      setInteractedIds(prev => new Set([...prev, userId]));
      setUsers(prev => prev.filter(u => u.id !== userId));

      const result = await api.friendify(currentUser.id, userId);
      if (result.isMatch) {
        setMatchCelebration({ name: result.matchedUserName });
      } else {
        toast("friendify sent!", { duration: 1500 });
      }
    } catch (err) {
      console.error("Error friendifying:", err);
      toast.error("failed to friendify");
    }
  };

  const handleBye = async (userId: string) => {
    if (!currentUser) return;
    try {
      // Animate slide out to the left
      setSlidingOut({ id: userId, direction: "left" });
      await new Promise((resolve) => setTimeout(resolve, 300));

      setSlidingOut(null);
      setInteractedIds(prev => new Set([...prev, userId]));
      setUsers(prev => prev.filter(u => u.id !== userId));

      await api.reject(currentUser.id, userId);
      toast("bye! maybe next time", { duration: 1500 });
    } catch (err) {
      console.error("Error rejecting:", err);
    }
  };

  const handleViewWhoLikedYou = async () => {
    if (!premiumStatus.isPremium) {
      toast("upgrade to friendli+ to see who friendified you!");
      navigate("/settings");
      return;
    }
    try {
      const result = await api.getReceivedFriendifies(currentUser.id);
      setWhoLikedYou(result.users || []);
      setShowWhoLikedYou(true);
    } catch (err) {
      console.error("Error fetching who liked you:", err);
      toast.error("failed to load");
    }
  };

  const filteredUsers = getFilteredUsers();
  const hasActiveFilters = filters.ageMin || filters.ageMax || filters.city || filters.hobbies.length > 0 || (filters.personality && filters.personality !== "no preference") || filters.radius;

  const FILTER_HOBBIES = [
    "hiking", "reading", "cooking", "gaming", "yoga", "photography",
    "traveling", "music", "art", "sports", "dancing", "writing",
    "movies", "coffee", "fitness", "volunteering"
  ];

  return (
    <div className="flex flex-col min-h-full bg-[#FDFAEC]">
      <div className="px-4 pt-4 pb-3 border-b border-[#EE964B]/15 mb-3">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0D3B66] lowercase">discover</h1>
          <p className="text-[#EE964B] lowercase text-sm font-semibold">friend recommendations</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-xl transition-colors bg-[#EE964B]/10 text-[#EE964B] hover:bg-[#EE964B]/20 disabled:opacity-50"
          >
            <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleViewWhoLikedYou}
            className={`p-2 rounded-xl transition-colors ${premiumStatus.isPremium ? "bg-[#EE964B]/10 text-[#EE964B]" : "bg-[#0D3B66]/5 text-[#0D3B66]/30"}`}
          >
            <Eye size={20} />
          </button>
          <button
            onClick={() => {
              if (!premiumStatus.isPremium) {
                toast("upgrade to friendli+ for advanced filters!");
                navigate("/settings");
                return;
              }
              setShowFilters(true);
            }}
            className={`p-2 rounded-xl transition-colors ${hasActiveFilters ? "bg-[#EE964B] text-white" : premiumStatus.isPremium ? "bg-[#EE964B]/10 text-[#EE964B]" : "bg-[#0D3B66]/5 text-[#0D3B66]/30"}`}
          >
            <SlidersHorizontal size={20} />
          </button>
        </div>
        </div>
      </div>

      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div
          className="flex items-center justify-center overflow-hidden transition-all"
          style={{ height: pullDistance }}
        >
          <RefreshCw
            size={20}
            className={`text-[#EE964B] transition-transform ${pullDistance >= PULL_THRESHOLD ? "animate-spin" : ""}`}
            style={{ transform: `rotate(${pullDistance * 3}deg)` }}
          />
          <span className="ml-2 text-xs text-[#0D3B66]/50 lowercase font-medium">
            {pullDistance >= PULL_THRESHOLD ? "release to refresh" : "pull to refresh"}
          </span>
        </div>
      )}

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-[#EE964B]" size={32} />
        </div>
      )}

      {!loading && filteredUsers.length === 0 && (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center w-full">
            <div className="relative mx-auto mb-4 w-24 h-24 flex items-center justify-center">
              <Users className="absolute text-[#EE964B]/20" size={64} />
              <Search className="absolute -top-1 -right-1 text-[#0D3B66]/15" size={28} />
              <MapPin className="absolute -bottom-1 -left-1 text-[#E8556D]/20" size={24} />
              <Coffee className="absolute top-0 left-0 text-[#F4D35E]/25" size={20} />
              <Heart className="absolute -bottom-2 right-0 text-[#EE964B]/20" size={22} />
            </div>
            <h3 className="text-lg font-extrabold text-[#0D3B66] lowercase mb-1">
              {users.length === 0 ? "no one here yet" : "no matches for your filters"}
            </h3>
            <p className="text-sm text-[#0D3B66]/60 lowercase font-medium mb-4">
              {users.length === 0 ? "" : "try adjusting your filters to see more people"}
            </p>
            <div className="flex gap-2 justify-center">
              {hasActiveFilters && (
                <Button
                  onClick={() => setFilters({ ageMin: "", ageMax: "", city: "", hobbies: [], personality: "", radius: "" })}
                  className="bg-[#EE964B] hover:bg-[#EE964B]/90 text-white lowercase font-bold"
                >
                  clear filters
                </Button>
              )}
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="lowercase border-[#EE964B]/30 text-[#EE964B] font-bold"
              >
                <RefreshCw size={16} className="mr-1.5" /> refresh
              </Button>
            </div>
          </div>
        </div>
      )}

      {!loading && filteredUsers.length > 0 && (
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 pb-4 space-y-4"
          onTouchStart={handlePullTouchStart}
          onTouchMove={handlePullTouchMove}
          onTouchEnd={handlePullTouchEnd}
        >
          <AnimatePresence mode="popLayout">
            {filteredUsers.map((user) => (
              <motion.div
                key={user.id}
                layout
                initial={{ opacity: 1, x: 0 }}
                animate={
                  slidingOut?.id === user.id
                    ? {
                        x: slidingOut.direction === "left" ? -400 : 400,
                        opacity: 0,
                        transition: { duration: 0.3, ease: "easeIn" },
                      }
                    : { opacity: 1, x: 0 }
                }
                exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.2 } }}
              >
                <ProfileCard
                  user={user}
                  onBye={() => handleBye(user.id)}
                  onFriendify={() => handleFriendify(user.id)}
                  isInteracted={interactedIds.has(user.id)}
                  commonHobbiesCount={getCommonHobbiesCount(user.hobbies)}
                  currentUserLat={currentUser?.lat}
                  currentUserLng={currentUser?.lng}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {!premiumStatus.isPremium && (
            <div className="bg-white rounded-2xl shadow-lg p-5 text-center">
              <Crown className="mx-auto mb-2 text-[#F4D35E]" size={28} />
              <h3 className="text-base font-extrabold text-[#0D3B66] lowercase mb-1">
                {users.length > DAILY_REC_LIMIT ? "want to see more?" : "unlock premium features"}
              </h3>
              <p className="text-xs text-[#0D3B66]/60 lowercase font-medium mb-3">
                unlimited discovery, advanced filters, see who liked you, and more
              </p>
              <Button
                onClick={() => navigate("/settings")}
                className="w-full bg-gradient-to-r from-[#EE964B] to-[#F95738] hover:opacity-90 text-white font-black lowercase py-3"
              >
                <Crown className="mr-2" size={16} />
                try friendli+ free
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Match Celebration Overlay */}
      <AnimatePresence>
        {matchCelebration && (
          <MatchCelebration
            matchName={matchCelebration.name}
            onDismiss={() => setMatchCelebration(null)}
          />
        )}
      </AnimatePresence>

      {/* Filter Dialog */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="bg-white max-w-[400px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#0D3B66] lowercase font-black flex items-center gap-2">
              <Filter size={20} className="text-[#EE964B]" /> advanced filters
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="lowercase text-[#0D3B66] font-semibold text-sm">age range</Label>
              <div className="flex gap-2 items-center">
                <Input type="number" placeholder="min" value={filters.ageMin} onChange={(e) => setFilters({ ...filters, ageMin: e.target.value })} className="bg-[#FDFAEC] border-[#EE964B]/30 text-sm" />
                <span className="text-[#0D3B66]/40 font-bold">-</span>
                <Input type="number" placeholder="max" value={filters.ageMax} onChange={(e) => setFilters({ ...filters, ageMax: e.target.value })} className="bg-[#FDFAEC] border-[#EE964B]/30 text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="lowercase text-[#0D3B66] font-semibold text-sm">city</Label>
              <Input placeholder="filter by city" value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} className="lowercase bg-[#FDFAEC] border-[#EE964B]/30 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="lowercase text-[#0D3B66] font-semibold text-sm">distance radius</Label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={filters.radius || "50"}
                  onChange={(e) => setFilters({ ...filters, radius: e.target.value })}
                  className="flex-1 accent-[#EE964B]"
                />
                <span className="text-sm font-bold text-[#0D3B66] w-16 text-right">
                  {filters.radius ? `${filters.radius} mi` : "any"}
                </span>
              </div>
              <p className="text-[9px] text-[#0D3B66]/40 lowercase font-medium">
                {currentUser?.zipCode ? `based on your zip code (${currentUser.zipCode})` : "add a zip code in your profile to enable"}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="lowercase text-[#0D3B66] font-semibold text-sm">personality</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {["introvert", "extrovert", "ambivert", "no preference"].map((type) => (
                  <button key={type} onClick={() => setFilters({ ...filters, personality: filters.personality === type ? "" : type })}
                    className={`px-2 py-2 rounded-lg lowercase text-xs transition-all font-semibold ${filters.personality === type ? "bg-[#EE964B] text-white" : "bg-[#FDFAEC] border border-[#0D3B66]/10 text-[#0D3B66]"}`}>
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="lowercase text-[#0D3B66] font-semibold text-sm">hobbies</Label>
              <div className="flex flex-wrap gap-1.5">
                {FILTER_HOBBIES.map((hobby) => (
                  <button key={hobby}
                    onClick={() => setFilters(prev => ({ ...prev, hobbies: prev.hobbies.includes(hobby) ? prev.hobbies.filter(h => h !== hobby) : [...prev.hobbies, hobby] }))}
                    className={`px-3 py-1.5 rounded-full lowercase text-xs transition-all font-semibold ${filters.hobbies.includes(hobby) ? "bg-[#EE964B] text-white" : "bg-[#FDFAEC] border border-[#0D3B66]/10 text-[#0D3B66]"}`}>
                    {hobby}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => { setFilters({ ageMin: "", ageMax: "", city: "", hobbies: [], personality: "", radius: "" }); setShowFilters(false); }} variant="outline" className="flex-1 lowercase border-[#0D3B66]/20 text-[#0D3B66] font-bold">
                clear all
              </Button>
              <Button onClick={() => setShowFilters(false)} className="flex-1 bg-[#EE964B] hover:bg-[#EE964B]/90 text-white lowercase font-bold">
                apply filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Who Liked You Dialog */}
      <Dialog open={showWhoLikedYou} onOpenChange={setShowWhoLikedYou}>
        <DialogContent className="bg-white max-w-[400px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#0D3B66] lowercase font-black flex items-center gap-2">
              <Sparkles size={20} className="text-[#EE964B]" /> who friendified you
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {whoLikedYou.length === 0 ? (
              <p className="text-center text-[#0D3B66]/50 lowercase font-medium py-4">no one has friendified you yet. keep discovering!</p>
            ) : (
              whoLikedYou.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-3 bg-[#FDFAEC] rounded-xl">
                  {user.profilePhoto ? (
                    <img src={user.profilePhoto} alt={user.name} className="w-12 h-12 rounded-full object-cover border-2 border-[#EE964B]" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#EE964B]/20 flex items-center justify-center border-2 border-[#EE964B]">
                      <span className="text-[#EE964B] font-bold">{user.name?.[0]?.toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#0D3B66] lowercase text-sm">{user.name}, {user.age}</p>
                    <p className="text-xs text-[#0D3B66]/50 lowercase truncate">{user.city}</p>
                  </div>
                  <Button
                    onClick={() => { handleFriendify(user.id); setWhoLikedYou(prev => prev.filter(u => u.id !== user.id)); }}
                    size="sm" className="bg-[#EE964B] hover:bg-[#EE964B]/90 text-white lowercase font-bold text-xs">
                    <Heart size={14} className="mr-1" /> friendify
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

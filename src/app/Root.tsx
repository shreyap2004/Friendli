import { Outlet, useLocation, useNavigate } from "react-router";
import { Home, MessageCircle, User, Settings } from "lucide-react";
import { useEffect, useState } from "react";

const PROTECTED_ROUTES = ["/home", "/messages", "/profile", "/settings"];

function SplashScreen() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 bg-gradient-to-br from-[#D4803F] to-[#E04A2B]">
      <h1 className="text-5xl font-black text-white lowercase drop-shadow-md mb-2">friendli</h1>
      <p className="text-white/90 lowercase font-semibold drop-shadow-sm">make meaningful connections</p>
    </div>
  );
}

export default function Root() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unreadMatches, setUnreadMatches] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('friendli_user');
    const authed = !!auth;
    setIsAuthenticated(authed);
    setAuthChecked(true);

    if (!authed && PROTECTED_ROUTES.includes(location.pathname)) {
      navigate('/', { replace: true });
    }
    if (authed && location.pathname === '/') {
      const onboarded = localStorage.getItem('friendli_onboarded');
      if (onboarded) navigate('/home', { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    const checkUnread = async () => {
      const user = localStorage.getItem('friendli_user');
      if (!user) return;
      try {
        const parsed = JSON.parse(user);
        const res = await fetch(
          `https://vaqvxkjelzrzwbtdohsa.supabase.co/functions/v1/make-server-50b042b1/chats/${parsed.id}`,
          { headers: { Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhcXZ4a2plbHpyendidGRvaHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NDU5NzQsImV4cCI6MjA4ODQyMTk3NH0.JzR5ankoUQtOg-uZSgJwsACFlI1eS8j0NRN4HNa4144` } }
        );
        if (res.ok) {
          const data = await res.json();
          const chats = data.chats || [];
          const newMatchCount = chats.filter((c: { isNewMatch?: boolean; messages?: unknown[] }) =>
            c.isNewMatch && (!c.messages || c.messages.length === 0)
          ).length;
          setUnreadMatches(newMatchCount);
        }
      } catch { /* silent */ }
    };
    checkUnread();
    const interval = setInterval(checkUnread, 10000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  // Set background on html and body to match current page
  // This ensures no gaps show wrong colors on any device
  useEffect(() => {
    const isLoginOrSplash = location.pathname === '/' && !isAuthenticated;
    const bg = isLoginOrSplash ? "#D4803F" : "#FDFAEC";
    document.documentElement.style.background = bg;
    document.body.style.background = bg;
  }, [location.pathname, isAuthenticated]);

  const showNavigation = isAuthenticated &&
    location.pathname !== '/' &&
    location.pathname !== '/onboarding';

  const isActive = (path: string) => location.pathname === path;

  if (!authChecked) return <SplashScreen />;

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: "#FDFAEC" }}>
      {/* Scrollable content area */}
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
        <Outlet />
      </div>

      {showNavigation && (
        <nav className="flex-shrink-0 bg-white border-t border-[#EE964B]/20 px-4 py-2 flex justify-around items-center z-50">
          <button
            onClick={() => navigate('/home')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
              isActive('/home') ? 'text-[#EE964B] bg-[#EE964B]/10' : 'text-[#0D3B66]/40'
            }`}
          >
            <Home size={22} strokeWidth={isActive('/home') ? 2.5 : 2} />
            <span className="text-[10px] lowercase font-semibold">discover</span>
          </button>
          <button
            onClick={() => navigate('/messages')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative ${
              isActive('/messages') ? 'text-[#EE964B] bg-[#EE964B]/10' : 'text-[#0D3B66]/40'
            }`}
          >
            <MessageCircle size={22} strokeWidth={isActive('/messages') ? 2.5 : 2} />
            {unreadMatches > 0 && (
              <div className="absolute -top-0.5 right-1 w-4 h-4 bg-[#F95738] rounded-full flex items-center justify-center">
                <span className="text-white text-[9px] font-bold">{unreadMatches}</span>
              </div>
            )}
            <span className="text-[10px] lowercase font-semibold">messages</span>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
              isActive('/profile') ? 'text-[#EE964B] bg-[#EE964B]/10' : 'text-[#0D3B66]/40'
            }`}
          >
            <User size={22} strokeWidth={isActive('/profile') ? 2.5 : 2} />
            <span className="text-[10px] lowercase font-semibold">profile</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
              isActive('/settings') ? 'text-[#EE964B] bg-[#EE964B]/10' : 'text-[#0D3B66]/40'
            }`}
          >
            <Settings size={22} strokeWidth={isActive('/settings') ? 2.5 : 2} />
            <span className="text-[10px] lowercase font-semibold">settings</span>
          </button>
        </nav>
      )}
    </div>
  );
}

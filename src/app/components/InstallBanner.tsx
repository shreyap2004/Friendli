import { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";
import { Button } from "./ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isMobile = typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    // Don't show if already installed as PWA
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone;
    if (standalone) return;

    // Don't show if user dismissed before this session
    if (sessionStorage.getItem("friendli_install_dismissed")) return;

    // Chrome/Edge/Android: listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Show on any mobile browser
    if (isMobile) {
      setShowBanner(true);
    }

    // Desktop: give Chrome a moment to fire beforeinstallprompt
    if (!isMobile) {
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => {
        window.removeEventListener("beforeinstallprompt", handler);
        clearTimeout(timer);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [isMobile]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
    sessionStorage.setItem("friendli_install_dismissed", "true");
  };

  if (!showBanner || dismissed) return null;

  return (
    <div className="mx-4 mb-3">
      <div className="bg-gradient-to-r from-[#0D3B66] to-[#0D3B66]/90 rounded-2xl p-4 pb-5 shadow-lg relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/50 hover:text-white/80 z-10"
        >
          <X size={14} />
        </button>

        <div className="flex items-center gap-3 pr-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EE964B] to-[#F95738] flex items-center justify-center flex-shrink-0">
            <Download size={20} className="text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm lowercase">install friendli</p>
            <p className="text-white/60 text-xs lowercase font-medium">
              get the full app experience on your device
            </p>
          </div>

          {/* Chrome/Android: direct install button */}
          {deferredPrompt && (
            <Button
              onClick={handleInstall}
              size="sm"
              className="bg-[#EE964B] hover:bg-[#EE964B]/90 text-white lowercase font-bold text-xs flex-shrink-0"
            >
              install
            </Button>
          )}
        </div>

        {/* iOS Safari: always show instructions since there's no auto-install API */}
        {isIOS && !deferredPrompt && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-[10px] font-bold">1</span>
              </div>
              <p className="text-white/70 text-xs lowercase font-medium flex items-center gap-1">
                tap the <Share size={12} className="text-white/90 mx-0.5" /> share button in safari
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-[10px] font-bold">2</span>
              </div>
              <p className="text-white/70 text-xs lowercase font-medium">
                tap "add to home screen"
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-[10px] font-bold">3</span>
              </div>
              <p className="text-white/70 text-xs lowercase font-medium">
                tap "add" and friendli appears on your home screen
              </p>
            </div>
          </div>
        )}

        {/* Desktop without beforeinstallprompt: manual instructions */}
        {!isMobile && !deferredPrompt && (
          <div className="mt-2">
            <p className="text-white/50 text-[10px] lowercase font-medium">
              in chrome: click the install icon in the address bar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

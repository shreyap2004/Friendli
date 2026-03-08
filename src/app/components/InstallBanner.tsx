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
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const isStandalone = typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone);

  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isMobile = typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (isStandalone) return;
    // Don't show if user dismissed before this session
    if (sessionStorage.getItem("friendli_install_dismissed")) return;

    // Chrome/Edge/Android: listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Show on any mobile browser (including Safari)
    if (isMobile) {
      setShowBanner(true);
    }

    // Also show on desktop Chrome (it supports PWA install)
    // Give Chrome a moment to fire beforeinstallprompt
    const timer = setTimeout(() => {
      if (!isMobile) setShowBanner(true);
    }, 2000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSInstructions(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
    setShowIOSInstructions(false);
    sessionStorage.setItem("friendli_install_dismissed", "true");
  };

  if (!showBanner || dismissed || isStandalone) return null;

  return (
    <div className="mx-4 mb-3">
      <div className="bg-gradient-to-r from-[#0D3B66] to-[#0D3B66]/90 rounded-2xl p-4 shadow-lg relative">
        <button
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 text-white/40 hover:text-white/70 z-10"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EE964B] to-[#F95738] flex items-center justify-center flex-shrink-0">
            <Download size={20} className="text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm lowercase">install friendli</p>
            <p className="text-white/60 text-xs lowercase font-medium">
              get the full app experience on your device
            </p>
          </div>

          <Button
            onClick={handleInstall}
            size="sm"
            className="bg-[#EE964B] hover:bg-[#EE964B]/90 text-white lowercase font-bold text-xs flex-shrink-0"
          >
            install
          </Button>
        </div>

        {/* iOS instructions (shown after tapping install on Safari) */}
        {showIOSInstructions && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
            <p className="text-white/80 text-xs lowercase font-semibold">how to install on iphone:</p>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-[10px] font-bold">1</span>
              </div>
              <p className="text-white/60 text-xs lowercase font-medium flex items-center gap-1">
                tap the <Share size={12} className="text-white/80 inline" /> share button in safari's toolbar
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-[10px] font-bold">2</span>
              </div>
              <p className="text-white/60 text-xs lowercase font-medium">
                scroll down and tap "add to home screen"
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-[10px] font-bold">3</span>
              </div>
              <p className="text-white/60 text-xs lowercase font-medium">
                tap "add" - friendli will appear on your home screen
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

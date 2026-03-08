import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "./ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Don't show if user dismissed before this session
    if (sessionStorage.getItem("friendli_install_dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // For iOS Safari (no beforeinstallprompt), show a manual prompt
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    if (isIOS && isSafari) {
      setShowBanner(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

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

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="mx-4 mb-3">
      <div className="bg-gradient-to-r from-[#0D3B66] to-[#0D3B66]/90 rounded-2xl p-4 flex items-center gap-3 shadow-lg relative">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-white/40 hover:text-white/70"
        >
          <X size={16} />
        </button>

        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EE964B] to-[#F95738] flex items-center justify-center flex-shrink-0">
          <Download size={20} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm lowercase">install friendli</p>
          <p className="text-white/60 text-xs lowercase font-medium">
            {isIOS
              ? "tap share, then \"add to home screen\""
              : "add to your home screen for the best experience"}
          </p>
        </div>

        {!isIOS && deferredPrompt && (
          <Button
            onClick={handleInstall}
            size="sm"
            className="bg-[#EE964B] hover:bg-[#EE964B]/90 text-white lowercase font-bold text-xs flex-shrink-0"
          >
            install
          </Button>
        )}
      </div>
    </div>
  );
}

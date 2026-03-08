import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { 
  LogOut, 
  Trash2, 
  Lock, 
  Crown, 
  Check, 
  X as XIcon,
  Sparkles,
  Heart,
  MessageCircle,
  Eye,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export default function Settings() {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const isPremium = localStorage.getItem('friendli_premium') === 'true';

  const handleLogout = () => {
    localStorage.removeItem('friendli_user');
    localStorage.removeItem('friendli_onboarded');
    toast.success("logged out successfully");
    navigate('/');
  };

  const handleDeleteAccount = () => {
    localStorage.removeItem('friendli_user');
    localStorage.removeItem('friendli_onboarded');
    localStorage.removeItem('friendli_chats');
    localStorage.removeItem('friendli_premium');
    toast.success("account deleted");
    navigate('/');
  };

  const handleUpgrade = () => {
    localStorage.setItem('friendli_premium', 'true');
    toast.success("upgraded to friendli+! 🎉");
    setShowUpgradeDialog(false);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-4 pt-5 pb-3 border-b border-[#EE964B]/15">
        <h1 className="text-2xl font-black text-[#0D3B66] lowercase">settings</h1>
        <p className="text-[#EE964B] lowercase text-sm font-semibold">manage your account</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Premium Status */}
        {isPremium ? (
          <div className="bg-gradient-to-r from-[#EE964B] to-[#F95738] rounded-2xl shadow-lg p-5 text-white">
            <div className="flex items-center gap-3">
              <Crown size={28} strokeWidth={2.5} />
              <div>
                <h2 className="text-lg font-black lowercase">friendli+ member</h2>
                <p className="lowercase text-white/90 text-sm font-medium">you're enjoying all premium features!</p>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowUpgradeDialog(true)}
            className="w-full bg-gradient-to-r from-[#EE964B] to-[#F95738] hover:opacity-90 rounded-2xl shadow-lg p-5 text-white text-left transition-opacity active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown size={28} strokeWidth={2.5} />
                <div>
                  <h2 className="text-lg font-black lowercase">upgrade to friendli+</h2>
                  <p className="lowercase text-white/90 text-sm font-medium">unlock unlimited friendships</p>
                </div>
              </div>
              <Sparkles size={22} />
            </div>
          </button>
        )}

        {/* Account Settings */}
        <div className="bg-white rounded-2xl shadow-lg divide-y divide-[#EE964B]/15">
          <button
            onClick={() => toast("change password feature coming soon!")}
            className="w-full p-4 flex items-center gap-3 hover:bg-[#EE964B]/5 transition-colors first:rounded-t-2xl active:scale-[0.98]"
          >
            <div className="w-9 h-9 rounded-full bg-[#EE964B]/10 flex items-center justify-center">
              <Lock size={18} className="text-[#EE964B]" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-[#0D3B66] lowercase text-sm">change password</p>
              <p className="text-xs text-[#0D3B66]/60 lowercase font-medium">update your password</p>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="w-full p-4 flex items-center gap-3 hover:bg-[#EE964B]/5 transition-colors active:scale-[0.98]"
          >
            <div className="w-9 h-9 rounded-full bg-[#EE964B]/10 flex items-center justify-center">
              <LogOut size={18} className="text-[#EE964B]" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-[#0D3B66] lowercase text-sm">log out</p>
              <p className="text-xs text-[#0D3B66]/60 lowercase font-medium">sign out of your account</p>
            </div>
          </button>

          <button
            onClick={() => setShowDeleteDialog(true)}
            className="w-full p-4 flex items-center gap-3 hover:bg-red-50 transition-colors last:rounded-b-2xl active:scale-[0.98]"
          >
            <div className="w-9 h-9 rounded-full bg-[#F95738]/10 flex items-center justify-center">
              <Trash2 size={18} className="text-[#F95738]" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-[#F95738] lowercase text-sm">delete account</p>
              <p className="text-xs text-[#F95738]/60 lowercase font-medium">permanently remove your account</p>
            </div>
          </button>
        </div>

        {/* App Info */}
        <div className="bg-white rounded-2xl shadow-lg p-5 text-center">
          <h2 className="text-xl font-black text-[#EE964B] lowercase mb-1">friendli</h2>
          <p className="text-xs text-[#0D3B66]/70 lowercase font-medium">version 1.0.0</p>
          <p className="text-[10px] text-[#0D3B66]/50 lowercase mt-1 font-medium">
            making meaningful connections, one friend at a time
          </p>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="text-[#0D3B66] lowercase font-bold">delete account?</DialogTitle>
            <DialogDescription className="lowercase font-medium">
              this action cannot be undone. all your data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="lowercase border-[#0D3B66]/20 text-[#0D3B66] font-bold"
            >
              cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              className="lowercase bg-[#F95738] hover:bg-[#F95738]/90 text-white font-bold"
            >
              delete account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="bg-white max-w-[400px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Crown size={24} className="text-[#EE964B]" />
              <DialogTitle className="text-xl text-[#0D3B66] lowercase font-black">
                upgrade to friendli+
              </DialogTitle>
            </div>
            <DialogDescription className="lowercase text-sm font-medium">
              unlock unlimited potential to make meaningful friendships
            </DialogDescription>
          </DialogHeader>

          {/* Feature Comparison */}
          <div className="space-y-5 py-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Free Column */}
              <div className="space-y-3">
                <div className="bg-[#FDFAEC] rounded-lg p-3 text-center">
                  <h3 className="text-sm font-black text-[#0D3B66] lowercase">free</h3>
                  <p className="text-xl font-black text-[#0D3B66] mt-1">$0</p>
                </div>
                <div className="space-y-2.5">
                  <FeatureItem included={true} text="10 recs/day" />
                  <FeatureItem included={true} text="basic matching" />
                  <FeatureItem included={false} text="unlimited recs" />
                  <FeatureItem included={false} text="advanced filters" />
                  <FeatureItem included={false} text="see who friendified you" />
                  <FeatureItem included={false} text="priority matching" />
                  <FeatureItem included={false} text="boost profile" />
                </div>
              </div>

              {/* Premium Column */}
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-[#EE964B] to-[#F95738] rounded-lg p-3 text-center text-white">
                  <div className="flex items-center justify-center gap-1.5">
                    <Crown size={16} />
                    <h3 className="text-sm font-black lowercase">friendli+</h3>
                  </div>
                  <p className="text-xl font-black mt-1">$9.99<span className="text-[10px]">/mo</span></p>
                </div>
                <div className="space-y-2.5">
                  <FeatureItem included={true} text="10 recs/day" isPremium />
                  <FeatureItem included={true} text="basic matching" isPremium />
                  <FeatureItem included={true} text="unlimited recs" isPremium />
                  <FeatureItem included={true} text="advanced filters" isPremium />
                  <FeatureItem included={true} text="see who friendified you" isPremium />
                  <FeatureItem included={true} text="priority matching" isPremium />
                  <FeatureItem included={true} text="boost profile" isPremium />
                </div>
              </div>
            </div>

            {/* Premium Benefits */}
            <div className="bg-[#EE964B]/10 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-black text-[#EE964B] lowercase flex items-center gap-1.5">
                <Sparkles size={16} />
                premium benefits
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <BenefitCard icon={<Heart size={18} />} title="unlimited friendify" />
                <BenefitCard icon={<Eye size={18} />} title="see who likes you" />
                <BenefitCard icon={<MessageCircle size={18} />} title="priority support" />
                <BenefitCard icon={<Zap size={18} />} title="profile boost" />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-[#EE964B] to-[#F95738] hover:opacity-90 text-white lowercase py-5 text-sm font-black"
            >
              <Crown className="mr-2" size={18} />
              upgrade now - $9.99/month
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowUpgradeDialog(false)}
              className="w-full lowercase border-[#0D3B66]/20 text-[#0D3B66] font-bold"
            >
              maybe later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeatureItem({ included, text, isPremium }: { included: boolean; text: string; isPremium?: boolean }) {
  return (
    <div className="flex items-start gap-1.5">
      {included ? (
        <Check size={16} strokeWidth={3} className={isPremium ? "text-[#EE964B] flex-shrink-0" : "text-[#0D3B66] flex-shrink-0"} />
      ) : (
        <XIcon size={16} strokeWidth={2.5} className="text-[#0D3B66]/25 flex-shrink-0" />
      )}
      <span className={`text-xs lowercase font-semibold ${included ? 'text-[#0D3B66]' : 'text-[#0D3B66]/40'}`}>
        {text}
      </span>
    </div>
  );
}

function BenefitCard({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="bg-white rounded-lg p-3 text-center">
      <div className="text-[#EE964B] mb-1.5 flex justify-center">
        {icon}
      </div>
      <p className="text-[10px] font-bold text-[#0D3B66] lowercase">{title}</p>
    </div>
  );
}
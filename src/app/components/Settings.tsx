import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  LogOut, Trash2, Lock, Crown, Check, X as XIcon,
  Sparkles, Heart, MessageCircle, Eye, Zap, Clock, CreditCard
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "./ui/dialog";
import * as api from "@/lib/api";

const TRIAL_DURATION_MS = 48 * 60 * 60 * 1000; // 48 hours

export default function Settings() {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState<{
    isPremium: boolean; hasTrialed: boolean; daysRemaining: number; expired: boolean; hoursRemaining?: number;
  }>({ isPremium: false, hasTrialed: false, daysRemaining: 0, expired: false });
  const [loading, setLoading] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ cardNumber: "", expiry: "", cvv: "", name: "" });
  const currentUser = api.getCurrentUser();

  useEffect(() => {
    if (currentUser?.id) {
      api.checkPremium(currentUser.id)
        .then((result) => {
          // Recalculate with 48h trial
          if (result.hasTrialed && currentUser.premiumTrialStart) {
            const trialEnd = currentUser.premiumTrialStart + TRIAL_DURATION_MS;
            const now = Date.now();
            const isActive = now <= trialEnd || currentUser.premiumSubscribed;
            const hoursRemaining = isActive ? Math.ceil((trialEnd - now) / (60 * 60 * 1000)) : 0;
            setPremiumStatus({
              isPremium: isActive,
              hasTrialed: true,
              daysRemaining: Math.ceil(hoursRemaining / 24),
              hoursRemaining: Math.max(0, hoursRemaining),
              expired: !isActive && !currentUser.premiumSubscribed,
            });
          } else {
            setPremiumStatus(result);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleLogout = () => {
    api.clearCurrentUser();
    toast.success("logged out successfully");
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      await api.deleteAccount(currentUser.id);
    } catch {
      // Still clear locally even if server fails
    }
    api.clearCurrentUser();
    localStorage.removeItem("friendli_chats");
    setLoading(false);
    toast.success("account deleted");
    navigate("/");
  };

  const handleStartTrial = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const result = await api.startTrial(currentUser.id);
      if (result.expired) {
        setPremiumStatus({ isPremium: false, hasTrialed: true, daysRemaining: 0, expired: true });
        setShowUpgradeDialog(false);
        setShowPaymentDialog(true);
      } else {
        const hoursRemaining = Math.min(48, result.daysRemaining * 24);
        toast.success(`friendli+ trial started! ${hoursRemaining} hours of premium access`);
        setPremiumStatus({ isPremium: true, hasTrialed: true, daysRemaining: result.daysRemaining, hoursRemaining, expired: false });
        const user = api.getCurrentUser();
        if (user) {
          user.premium = true;
          user.premiumTrialStart = Date.now();
          api.setCurrentUser(user);
        }
      }
      setShowUpgradeDialog(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "failed to start trial";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    // Mock payment - always succeeds
    setLoading(true);
    try {
      const user = api.getCurrentUser();
      if (user) {
        user.premium = true;
        user.premiumSubscribed = true;
        api.setCurrentUser(user);
        await api.updateUser(user.id, { premium: true, premiumSubscribed: true });
      }
      toast.success("subscribed to friendli+! enjoy all premium features");
      setPremiumStatus({ isPremium: true, hasTrialed: true, daysRemaining: 30, expired: false });
      setShowPaymentDialog(false);
    } catch {
      toast.error("subscription failed, please try again");
    } finally {
      setLoading(false);
    }
  };

  const trialTimeDisplay = premiumStatus.hoursRemaining !== undefined && premiumStatus.hoursRemaining > 0
    ? premiumStatus.hoursRemaining > 24
      ? `${Math.ceil(premiumStatus.hoursRemaining / 24)} days`
      : `${premiumStatus.hoursRemaining} hours`
    : null;

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-4 pt-5 pb-3 border-b border-[#EE964B]/15">
        <h1 className="text-2xl font-black text-[#0D3B66] lowercase">settings</h1>
        <p className="text-[#EE964B] lowercase text-sm font-semibold">manage your account</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Premium Status */}
        {premiumStatus.isPremium ? (
          <div className="bg-gradient-to-r from-[#EE964B] to-[#F95738] rounded-2xl shadow-lg p-5 text-white">
            <div className="flex items-center gap-3">
              <Crown size={28} strokeWidth={2.5} />
              <div>
                <h2 className="text-lg font-black lowercase">friendli+ member</h2>
                <p className="lowercase text-white/90 text-sm font-medium">
                  {currentUser?.premiumSubscribed
                    ? "you're enjoying all premium features!"
                    : trialTimeDisplay
                      ? `${trialTimeDisplay} remaining in your free trial`
                      : "enjoying premium features!"}
                </p>
              </div>
            </div>
            {!currentUser?.premiumSubscribed && trialTimeDisplay && (
              <div className="mt-3 flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
                <Clock size={14} />
                <p className="text-xs font-semibold lowercase">trial ends in {trialTimeDisplay}</p>
              </div>
            )}
          </div>
        ) : premiumStatus.expired ? (
          <div className="bg-white rounded-2xl shadow-lg p-5 border-2 border-[#F95738]/30">
            <div className="flex items-center gap-3">
              <Crown size={28} className="text-[#0D3B66]/30" />
              <div>
                <h2 className="text-lg font-black text-[#0D3B66] lowercase">trial expired</h2>
                <p className="lowercase text-[#0D3B66]/60 text-sm font-medium">
                  your 48-hour free trial has ended. subscribe to keep premium features.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowPaymentDialog(true)}
              className="w-full mt-3 bg-gradient-to-r from-[#EE964B] to-[#F95738] hover:opacity-90 text-white lowercase font-black"
            >
              <CreditCard className="mr-2" size={16} />
              subscribe - $9.99/month
            </Button>
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
                  <h2 className="text-lg font-black lowercase">try friendli+ free</h2>
                  <p className="lowercase text-white/90 text-sm font-medium">48-hour free trial, no payment required</p>
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
          <p className="text-xs text-[#0D3B66]/70 lowercase font-medium">version 2.0.0</p>
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
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="lowercase border-[#0D3B66]/20 text-[#0D3B66] font-bold">cancel</Button>
            <Button onClick={handleDeleteAccount} className="lowercase bg-[#F95738] hover:bg-[#F95738]/90 text-white font-bold">delete account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog (Trial) */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="bg-white max-w-[400px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Crown size={24} className="text-[#EE964B]" />
              <DialogTitle className="text-xl text-[#0D3B66] lowercase font-black">try friendli+ free</DialogTitle>
            </div>
            <DialogDescription className="lowercase text-sm font-medium">
              start your 48-hour free trial and unlock all premium features
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-3">
                <div className="bg-[#FDFAEC] rounded-lg p-3 text-center">
                  <h3 className="text-sm font-black text-[#0D3B66] lowercase">free</h3>
                  <p className="text-xl font-black text-[#0D3B66] mt-1">$0</p>
                </div>
                <div className="space-y-2.5">
                  <FeatureItem included text="10 recs/day" />
                  <FeatureItem included text="basic matching" />
                  <FeatureItem included={false} text="unlimited recs" />
                  <FeatureItem included={false} text="advanced filters" />
                  <FeatureItem included={false} text="see who friendified you" />
                  <FeatureItem included={false} text="priority matching" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-[#EE964B] to-[#F95738] rounded-lg p-3 text-center text-white">
                  <div className="flex items-center justify-center gap-1.5">
                    <Crown size={16} />
                    <h3 className="text-sm font-black lowercase">friendli+</h3>
                  </div>
                  <p className="text-xl font-black mt-1">48h<span className="text-[10px]"> free</span></p>
                </div>
                <div className="space-y-2.5">
                  <FeatureItem included text="10 recs/day" isPremium />
                  <FeatureItem included text="basic matching" isPremium />
                  <FeatureItem included text="unlimited recs" isPremium />
                  <FeatureItem included text="advanced filters" isPremium />
                  <FeatureItem included text="see who friendified you" isPremium />
                  <FeatureItem included text="priority matching" isPremium />
                </div>
              </div>
            </div>

            <div className="bg-[#EE964B]/10 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-black text-[#EE964B] lowercase flex items-center gap-1.5">
                <Sparkles size={16} /> premium benefits
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
            <Button onClick={handleStartTrial} disabled={loading}
              className="w-full bg-gradient-to-r from-[#EE964B] to-[#F95738] hover:opacity-90 text-white lowercase py-5 text-sm font-black">
              <Crown className="mr-2" size={18} />
              {loading ? "starting trial..." : "start 48-hour free trial"}
            </Button>
            <p className="text-[10px] text-center text-[#0D3B66]/40 lowercase font-medium">
              no payment required. $9.99/month after trial ends.
            </p>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}
              className="w-full lowercase border-[#0D3B66]/20 text-[#0D3B66] font-bold">
              maybe later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog (After Trial Expires) */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="bg-white max-w-[400px]">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard size={24} className="text-[#EE964B]" />
              <DialogTitle className="text-lg text-[#0D3B66] lowercase font-black">subscribe to friendli+</DialogTitle>
            </div>
            <DialogDescription className="lowercase text-sm font-medium">
              continue enjoying unlimited features for $9.99/month
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="bg-gradient-to-r from-[#EE964B]/10 to-[#F95738]/10 rounded-xl p-4 text-center">
              <Crown size={24} className="text-[#EE964B] mx-auto mb-2" />
              <p className="text-2xl font-black text-[#0D3B66]">$9.99<span className="text-sm font-semibold text-[#0D3B66]/50">/month</span></p>
              <p className="text-xs text-[#0D3B66]/50 lowercase font-medium mt-1">cancel anytime</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="lowercase text-[#0D3B66] font-semibold text-sm">name on card</Label>
                <Input
                  placeholder="john doe"
                  value={paymentForm.name}
                  onChange={(e) => setPaymentForm({ ...paymentForm, name: e.target.value })}
                  className="bg-[#FDFAEC] border-[#EE964B]/30 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="lowercase text-[#0D3B66] font-semibold text-sm">card number</Label>
                <Input
                  placeholder="4242 4242 4242 4242"
                  value={paymentForm.cardNumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, cardNumber: e.target.value })}
                  className="bg-[#FDFAEC] border-[#EE964B]/30 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="lowercase text-[#0D3B66] font-semibold text-sm">expiry</Label>
                  <Input
                    placeholder="MM/YY"
                    value={paymentForm.expiry}
                    onChange={(e) => setPaymentForm({ ...paymentForm, expiry: e.target.value })}
                    className="bg-[#FDFAEC] border-[#EE964B]/30 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="lowercase text-[#0D3B66] font-semibold text-sm">cvv</Label>
                  <Input
                    placeholder="123"
                    value={paymentForm.cvv}
                    onChange={(e) => setPaymentForm({ ...paymentForm, cvv: e.target.value })}
                    className="bg-[#FDFAEC] border-[#EE964B]/30 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button onClick={handleSubscribe} disabled={loading}
              className="w-full bg-gradient-to-r from-[#EE964B] to-[#F95738] hover:opacity-90 text-white lowercase py-5 text-sm font-black">
              <CreditCard className="mr-2" size={18} />
              {loading ? "processing..." : "subscribe - $9.99/month"}
            </Button>
            <p className="text-[10px] text-center text-[#0D3B66]/30 lowercase font-medium">
              secure payment processing
            </p>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}
              className="w-full lowercase border-[#0D3B66]/20 text-[#0D3B66] font-bold">
              not now
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
      <span className={`text-xs lowercase font-semibold ${included ? "text-[#0D3B66]" : "text-[#0D3B66]/40"}`}>{text}</span>
    </div>
  );
}

function BenefitCard({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="bg-white rounded-lg p-3 text-center">
      <div className="text-[#EE964B] mb-1.5 flex justify-center">{icon}</div>
      <p className="text-[10px] font-bold text-[#0D3B66] lowercase">{title}</p>
    </div>
  );
}

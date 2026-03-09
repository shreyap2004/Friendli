import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import InstallBanner from "./InstallBanner";
import { toast } from "sonner";
import * as api from "@/lib/api";

export default function Auth() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSignUp && !name.trim()) {
      toast.error("please enter your name");
      return;
    }
    if (!email.trim() || !password) {
      toast.error("please enter email and password");
      return;
    }
    if (password.length < 4) {
      toast.error("password must be at least 4 characters");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const result = await api.register(email, password, name);
        api.setCurrentUser(result.user);
        toast.success("account created!");
        navigate("/onboarding");
      } else {
        const result = await api.login(email, password);
        api.setCurrentUser(result.user);
        if (result.user.onboarded) {
          toast.success(`welcome back, ${result.user.name}!`, {
            duration: 3000,
            style: { background: "#EE964B", color: "white", fontWeight: "bold" },
          });
          navigate("/home");
        } else {
          navigate("/onboarding");
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "something went wrong";
      if (!isSignUp && message.toLowerCase().includes("invalid")) {
        toast.error("no account found with that email. try signing up!", { duration: 4000 });
        setIsSignUp(true);
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 py-8 min-h-full">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Header */}
        <div className="text-center space-y-2 pt-2">
          <h1 className="text-5xl font-black text-white lowercase drop-shadow-md">friendli</h1>
          <p className="text-white/90 lowercase font-semibold drop-shadow-sm">make meaningful connections</p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-5">
          <div className="text-center">
            <h2 className="text-xl font-bold text-[#0D3B66] lowercase">
              {isSignUp ? "create account" : "welcome back"}
            </h2>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="lowercase text-[#0D3B66] font-semibold">name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="lowercase bg-[#FDFAEC] border-[#EE964B]/30 focus:border-[#EE964B] text-[#0D3B66] placeholder:text-[#0D3B66]/40"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="lowercase text-[#0D3B66] font-semibold">email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="lowercase bg-[#FDFAEC] border-[#EE964B]/30 focus:border-[#EE964B] text-[#0D3B66] placeholder:text-[#0D3B66]/40"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="lowercase text-[#0D3B66] font-semibold">password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#FDFAEC] border-[#EE964B]/30 focus:border-[#EE964B] text-[#0D3B66] placeholder:text-[#0D3B66]/40"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#D4803F] to-[#E04A2B] hover:opacity-90 text-white lowercase text-base py-6 font-bold"
            >
              {loading ? "loading..." : isSignUp ? "sign up" : "sign in"}
            </Button>
          </form>

          {/* Toggle Sign In/Sign Up */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#EE964B] hover:text-[#E04A2B] lowercase text-sm font-semibold"
            >
              {isSignUp ? "already have an account? sign in" : "don't have an account? sign up"}
            </button>
          </div>
        </div>

        {/* Install app banner */}
        <InstallBanner />
      </div>
    </div>
  );
}

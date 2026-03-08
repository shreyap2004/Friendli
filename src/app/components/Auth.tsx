import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Mail } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp && !name) {
      toast.error("please enter your name");
      return;
    }
    
    if (!email || !password) {
      toast.error("please enter email and password");
      return;
    }

    const user = {
      email,
      name: isSignUp ? name : "demo user",
      id: Date.now().toString()
    };
    
    localStorage.setItem('friendli_user', JSON.stringify(user));
    
    if (isSignUp) {
      toast.success("account created!");
      navigate('/onboarding');
    } else {
      toast.success("welcome back!");
      navigate('/home');
    }
  };

  const handleGoogleSignIn = () => {
    const user = {
      email: "demo@google.com",
      name: "demo user",
      id: Date.now().toString()
    };
    
    localStorage.setItem('friendli_user', JSON.stringify(user));
    toast.success("signed in with google!");
    
    const hasOnboarded = localStorage.getItem('friendli_onboarded');
    navigate(hasOnboarded ? '/home' : '/onboarding');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-gradient-to-br from-[#D4803F] to-[#E04A2B]">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Header */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-black text-white lowercase drop-shadow-md">friendli</h1>
          <p className="text-white/90 lowercase font-semibold drop-shadow-sm">make meaningful connections</p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-5">
          <div className="text-center">
            <h2 className="text-xl font-bold text-[#0D3B66] lowercase">
              {isSignUp ? 'create account' : 'welcome back'}
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
              className="w-full bg-gradient-to-r from-[#D4803F] to-[#E04A2B] hover:opacity-90 text-white lowercase text-base py-6 font-bold"
            >
              {isSignUp ? 'sign up' : 'sign in'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#0D3B66]/15"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[#0D3B66]/50 lowercase font-semibold">or</span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            className="w-full border-2 border-[#0D3B66]/20 text-[#0D3B66] hover:bg-[#FDFAEC] hover:border-[#EE964B] lowercase text-base py-6 font-bold"
          >
            <Mail className="mr-2" size={20} />
            continue with google
          </Button>

          {/* Toggle Sign In/Sign Up */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#EE964B] hover:text-[#E04A2B] lowercase text-sm font-semibold"
            >
              {isSignUp ? 'already have an account? sign in' : "don't have an account? sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
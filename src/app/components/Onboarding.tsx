import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

const HOBBIES = [
  "hiking", "reading", "cooking", "gaming", "yoga", "photography",
  "traveling", "music", "art", "sports", "dancing", "writing",
  "movies", "coffee", "fitness", "volunteering"
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    age: "",
    almaMater: "",
    gender: "",
    city: "",
    funFact: "",
    lookingFor: "",
    hobbies: [] as string[],
    customHobby: "",
    photos: [] as { file: string; hobby: string }[],
    personality: "",
    preferredHobbies: [] as string[],
  });

  const handleNext = () => {
    if (step === 1) {
      if (!formData.age || !formData.almaMater || !formData.gender || !formData.city) {
        toast.error("please fill in all basic info");
        return;
      }
    } else if (step === 2) {
      if (!formData.funFact || !formData.lookingFor) {
        toast.error("please share your fun fact and what you're looking for");
        return;
      }
    } else if (step === 3) {
      if (formData.hobbies.length === 0) {
        toast.error("please select at least one hobby");
        return;
      }
    }
    
    if (step < 4) {
      setStep(step + 1);
    } else {
      const user = JSON.parse(localStorage.getItem('friendli_user') || '{}');
      const profile = { ...user, ...formData };
      localStorage.setItem('friendli_user', JSON.stringify(profile));
      localStorage.setItem('friendli_onboarded', 'true');
      toast.success("profile created! let's find your friends");
      navigate('/home');
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleHobby = (hobby: string) => {
    setFormData(prev => ({
      ...prev,
      hobbies: prev.hobbies.includes(hobby)
        ? prev.hobbies.filter(h => h !== hobby)
        : [...prev.hobbies, hobby]
    }));
  };

  const togglePreferredHobby = (hobby: string) => {
    setFormData(prev => ({
      ...prev,
      preferredHobbies: prev.preferredHobbies.includes(hobby)
        ? prev.preferredHobbies.filter(h => h !== hobby)
        : [...prev.preferredHobbies, hobby]
    }));
  };

  const addCustomHobby = () => {
    if (formData.customHobby.trim()) {
      setFormData(prev => ({
        ...prev,
        hobbies: [...prev.hobbies, prev.customHobby.toLowerCase().trim()],
        customHobby: ""
      }));
    }
  };

  return (
    <div className="flex flex-col min-h-screen px-5 py-6 bg-background pb-20">
      <div className="w-full space-y-5">
        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-2xl font-black text-[#0D3B66] lowercase">let's set up your profile</h1>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-[#EE964B]' : 'bg-[#0D3B66]/15'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-5">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#0D3B66] lowercase">basic info</h2>
              
              <div className="space-y-1.5">
                <Label htmlFor="age" className="lowercase text-[#0D3B66] font-semibold">age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="25"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="bg-[#FDFAEC] border-[#EE964B]/30"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="almaMater" className="lowercase text-[#0D3B66] font-semibold">alma mater</Label>
                <Input
                  id="almaMater"
                  placeholder="university name"
                  value={formData.almaMater}
                  onChange={(e) => setFormData({ ...formData, almaMater: e.target.value })}
                  className="bg-[#FDFAEC] border-[#EE964B]/30"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gender" className="lowercase text-[#0D3B66] font-semibold">gender</Label>
                <Input
                  id="gender"
                  placeholder="your gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="lowercase bg-[#FDFAEC] border-[#EE964B]/30"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="city" className="lowercase text-[#0D3B66] font-semibold">city</Label>
                <Input
                  id="city"
                  placeholder="where you live"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="lowercase bg-[#FDFAEC] border-[#EE964B]/30"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#0D3B66] lowercase">about you</h2>
              
              <div className="space-y-1.5">
                <Label htmlFor="funFact" className="lowercase text-[#0D3B66] font-semibold">fun fact</Label>
                <Textarea
                  id="funFact"
                  placeholder="share something interesting about yourself..."
                  value={formData.funFact}
                  onChange={(e) => setFormData({ ...formData, funFact: e.target.value })}
                  className="lowercase bg-[#FDFAEC] border-[#EE964B]/30 min-h-24"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lookingFor" className="lowercase text-[#0D3B66] font-semibold">
                  what are you looking for in a friend?
                </Label>
                <Textarea
                  id="lookingFor"
                  placeholder="describe your ideal friendship..."
                  value={formData.lookingFor}
                  onChange={(e) => setFormData({ ...formData, lookingFor: e.target.value })}
                  className="lowercase bg-[#FDFAEC] border-[#EE964B]/30 min-h-24"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#0D3B66] lowercase">your hobbies & interests</h2>
              <p className="text-sm text-[#0D3B66]/70 lowercase font-medium">select all that apply</p>
              
              <div className="flex flex-wrap gap-2">
                {HOBBIES.map((hobby) => (
                  <button
                    key={hobby}
                    onClick={() => toggleHobby(hobby)}
                    className={`px-4 py-2 rounded-full lowercase text-sm transition-all font-semibold ${
                      formData.hobbies.includes(hobby)
                        ? 'bg-[#EE964B] text-white'
                        : 'bg-white border-2 border-[#0D3B66]/15 text-[#0D3B66] hover:border-[#EE964B]'
                    }`}
                  >
                    {hobby}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5 pt-2">
                <Label className="lowercase text-[#0D3B66] font-semibold">add custom hobby</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., pottery"
                    value={formData.customHobby}
                    onChange={(e) => setFormData({ ...formData, customHobby: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomHobby())}
                    className="lowercase bg-[#FDFAEC] border-[#EE964B]/30"
                  />
                  <Button
                    onClick={addCustomHobby}
                    className="bg-[#EE964B] hover:bg-[#EE964B]/90 text-white lowercase font-bold"
                  >
                    add
                  </Button>
                </div>
              </div>

              {formData.hobbies.filter(h => !HOBBIES.includes(h)).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.hobbies.filter(h => !HOBBIES.includes(h)).map((hobby) => (
                    <button
                      key={hobby}
                      onClick={() => toggleHobby(hobby)}
                      className="px-4 py-2 rounded-full lowercase text-sm bg-[#EE964B] text-white font-semibold"
                    >
                      {hobby}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#0D3B66] lowercase">your preferences</h2>
              
              <div className="space-y-2">
                <Label className="lowercase text-[#0D3B66] font-semibold">personality preference</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['introvert', 'extrovert', 'ambivert', 'no preference'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, personality: type })}
                      className={`px-3 py-3 rounded-xl lowercase text-sm transition-all font-semibold ${
                        formData.personality === type
                          ? 'bg-[#EE964B] text-white'
                          : 'bg-white border-2 border-[#0D3B66]/15 text-[#0D3B66] hover:border-[#EE964B]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="lowercase text-[#0D3B66] font-semibold">
                  what hobbies would you like in a friend?
                </Label>
                <p className="text-xs text-[#0D3B66]/70 lowercase font-medium">optional - leave blank for no preference</p>
                <div className="flex flex-wrap gap-2">
                  {HOBBIES.map((hobby) => (
                    <button
                      key={hobby}
                      onClick={() => togglePreferredHobby(hobby)}
                      className={`px-4 py-2 rounded-full lowercase text-sm transition-all font-semibold ${
                        formData.preferredHobbies.includes(hobby)
                          ? 'bg-[#F95738] text-white'
                          : 'bg-white border-2 border-[#0D3B66]/15 text-[#0D3B66] hover:border-[#F95738]'
                      }`}
                    >
                      {hobby}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          {step > 1 && (
            <Button
              onClick={handleBack}
              variant="outline"
              className="flex-1 border-2 border-[#0D3B66]/20 text-[#0D3B66] hover:bg-[#FDFAEC] lowercase py-6 font-bold"
            >
              <ChevronLeft className="mr-2" size={20} />
              back
            </Button>
          )}
          <Button
            onClick={handleNext}
            className="flex-1 bg-[#EE964B] hover:bg-[#EE964B]/90 text-white lowercase py-6 font-bold"
          >
            {step === 4 ? 'finish' : 'next'}
            {step < 4 && <ChevronRight className="ml-2" size={20} />}
          </Button>
        </div>
      </div>
    </div>
  );
}
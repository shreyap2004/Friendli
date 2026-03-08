import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { ChevronRight, ChevronLeft, Camera, X, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import * as api from "@/lib/api";
import { geocodeZip } from "@/lib/geo";

const HOBBIES = [
  "hiking", "reading", "cooking", "gaming", "yoga", "photography",
  "traveling", "music", "art", "sports", "dancing", "writing",
  "movies", "coffee", "fitness", "volunteering"
];

function compressImage(file: File, maxSize: number = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxSize) { h = (h * maxSize) / w; w = maxSize; }
        } else {
          if (h > maxSize) { w = (w * maxSize) / h; h = maxSize; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const hobbyPhotoRef = useRef<HTMLInputElement>(null);
  const [uploadingHobby, setUploadingHobby] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    age: "",
    almaMater: "",
    gender: "",
    city: "",
    zipCode: "",
    funFact: "",
    lookingFor: "",
    hobbies: [] as string[],
    customHobby: "",
    profilePhoto: "",
    hobbyPhotos: {} as Record<string, string>,
    personality: "",
    preferredHobbies: [] as string[],
  });

  const handleNext = () => {
    if (step === 1) {
      if (!formData.age || !formData.gender || !formData.city) {
        toast.error("please fill in age, gender, and city");
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

    if (step < 5) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const user = api.getCurrentUser();
      if (!user) {
        toast.error("session expired, please sign in again");
        navigate("/");
        return;
      }

      let lat = null;
      let lng = null;
      if (formData.zipCode) {
        const coords = await geocodeZip(formData.zipCode);
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
        }
      }

      const profileData = {
        age: formData.age,
        almaMater: formData.almaMater,
        gender: formData.gender,
        city: formData.city,
        zipCode: formData.zipCode,
        lat,
        lng,
        funFact: formData.funFact,
        lookingFor: formData.lookingFor,
        hobbies: formData.hobbies,
        profilePhoto: formData.profilePhoto,
        hobbyPhotos: formData.hobbyPhotos,
        personality: formData.personality,
        preferredHobbies: formData.preferredHobbies,
        onboarded: true,
      };

      const result = await api.updateUser(user.id, profileData);
      api.setCurrentUser(result.user);
      localStorage.setItem("friendli_onboarded", "true");
      toast.success("profile created! let's find your friends");
      navigate("/home");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "failed to save profile";
      toast.error(message);
    } finally {
      setSaving(false);
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

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 300);
      setFormData(prev => ({ ...prev, profilePhoto: compressed }));
      toast.success("profile photo added!");
    } catch {
      toast.error("failed to process image");
    }
  };

  const handleHobbyPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingHobby) return;
    try {
      const compressed = await compressImage(file, 300);
      setFormData(prev => ({
        ...prev,
        hobbyPhotos: { ...prev.hobbyPhotos, [uploadingHobby]: compressed }
      }));
      toast.success(`photo added for ${uploadingHobby}!`);
    } catch {
      toast.error("failed to process image");
    }
    setUploadingHobby(null);
  };

  const totalSteps = 5;

  return (
    <div className="flex flex-col min-h-screen px-5 py-6 bg-background pb-20">
      <div className="w-full space-y-5">
        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-2xl font-black text-[#0D3B66] lowercase">let's set up your profile</h1>
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-[#EE964B]" : "bg-[#0D3B66]/15"
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
                <Label htmlFor="almaMater" className="lowercase text-[#0D3B66] font-semibold">alma mater <span className="text-[#0D3B66]/40 font-medium">(optional)</span></Label>
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

              <div className="space-y-1.5">
                <Label htmlFor="zipCode" className="lowercase text-[#0D3B66] font-semibold">zip code <span className="text-[#0D3B66]/40 font-medium">(optional)</span></Label>
                <Input
                  id="zipCode"
                  placeholder="98101"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  className="bg-[#FDFAEC] border-[#EE964B]/30"
                  maxLength={5}
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
                        ? "bg-[#EE964B] text-white"
                        : "bg-white border-2 border-[#0D3B66]/15 text-[#0D3B66] hover:border-[#EE964B]"
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
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomHobby())}
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
              <h2 className="text-lg font-bold text-[#0D3B66] lowercase">add your photos</h2>
              <p className="text-sm text-[#0D3B66]/70 lowercase font-medium">
                upload a profile photo and optionally add photos for your hobbies. you can skip and add them later.
              </p>

              {/* Profile Photo */}
              <div className="space-y-2">
                <Label className="lowercase text-[#0D3B66] font-semibold">profile photo</Label>
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => profilePhotoRef.current?.click()}
                    className="w-24 h-24 rounded-full border-3 border-dashed border-[#EE964B]/40 flex items-center justify-center cursor-pointer hover:border-[#EE964B] transition-colors overflow-hidden bg-[#FDFAEC]"
                  >
                    {formData.profilePhoto ? (
                      <img src={formData.profilePhoto} alt="profile" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={28} className="text-[#EE964B]/50" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#0D3B66]/60 lowercase font-medium">
                      {formData.profilePhoto ? "tap to change" : "tap to upload"}
                    </p>
                    {formData.profilePhoto && (
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, profilePhoto: "" }))}
                        className="text-xs text-[#F95738] lowercase font-semibold mt-1"
                      >
                        remove
                      </button>
                    )}
                  </div>
                </div>
                <input
                  ref={profilePhotoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePhotoUpload}
                />
              </div>

              {/* Hobby Photos */}
              {formData.hobbies.length > 0 && (
                <div className="space-y-2 pt-2">
                  <Label className="lowercase text-[#0D3B66] font-semibold">hobby photos (optional)</Label>
                  <p className="text-xs text-[#0D3B66]/50 lowercase font-medium">
                    add photos that show you enjoying your hobbies
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {formData.hobbies.map((hobby) => (
                      <div key={hobby} className="relative">
                        <div
                          onClick={() => {
                            setUploadingHobby(hobby);
                            hobbyPhotoRef.current?.click();
                          }}
                          className="aspect-square rounded-xl border-2 border-dashed border-[#EE964B]/30 flex flex-col items-center justify-center cursor-pointer hover:border-[#EE964B] transition-colors overflow-hidden bg-[#FDFAEC]"
                        >
                          {formData.hobbyPhotos[hobby] ? (
                            <img src={formData.hobbyPhotos[hobby]} alt={hobby} className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <ImagePlus size={20} className="text-[#EE964B]/40 mb-1" />
                              <span className="text-[9px] text-[#0D3B66]/50 lowercase font-semibold">{hobby}</span>
                            </>
                          )}
                        </div>
                        {formData.hobbyPhotos[hobby] && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData(prev => {
                                const photos = { ...prev.hobbyPhotos };
                                delete photos[hobby];
                                return { ...prev, hobbyPhotos: photos };
                              });
                            }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-[#F95738] rounded-full flex items-center justify-center"
                          >
                            <X size={12} className="text-white" />
                          </button>
                        )}
                        <p className="text-[9px] text-center text-[#0D3B66]/60 lowercase font-semibold mt-1 truncate">
                          {hobby}
                        </p>
                      </div>
                    ))}
                  </div>
                  <input
                    ref={hobbyPhotoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleHobbyPhotoUpload}
                  />
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#0D3B66] lowercase">your preferences</h2>

              <div className="space-y-2">
                <Label className="lowercase text-[#0D3B66] font-semibold">personality preference</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["introvert", "extrovert", "ambivert", "no preference"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, personality: type })}
                      className={`px-3 py-3 rounded-xl lowercase text-sm transition-all font-semibold ${
                        formData.personality === type
                          ? "bg-[#EE964B] text-white"
                          : "bg-white border-2 border-[#0D3B66]/15 text-[#0D3B66] hover:border-[#EE964B]"
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
                          ? "bg-[#F95738] text-white"
                          : "bg-white border-2 border-[#0D3B66]/15 text-[#0D3B66] hover:border-[#F95738]"
                      }`}
                    >
                      {hobby}
                    </button>
                  ))}
                </div>
              </div>

              {/* Profile Preview Card */}
              <div className="space-y-2 pt-4">
                <h3 className="text-sm font-bold text-[#0D3B66] lowercase">preview of your profile card</h3>
                <div className="border border-[#0D3B66]/15 rounded-2xl shadow-sm overflow-hidden bg-white scale-[0.92] origin-top">
                  {/* Header row */}
                  <div className="px-3 pt-3 pb-1.5 flex items-center gap-2.5">
                    {formData.profilePhoto ? (
                      <img src={formData.profilePhoto} alt="profile" className="w-9 h-9 rounded-full object-cover border-2 border-[#EE964B]" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#EE964B]/20 flex items-center justify-center border-2 border-[#EE964B]">
                        <span className="text-[#EE964B] font-black text-sm">
                          {(api.getCurrentUser()?.name || "?")[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-[#0D3B66] lowercase">
                        {api.getCurrentUser()?.name || "you"}{formData.age ? `, ${formData.age}` : ""}
                      </h4>
                      <p className="text-[10px] text-[#0D3B66]/50 lowercase font-medium">
                        {formData.city}{formData.zipCode ? ` ${formData.zipCode}` : ""}{formData.almaMater ? ` - ${formData.almaMater}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Hobby photos strip */}
                  {Object.keys(formData.hobbyPhotos).length > 0 && (
                    <div className="flex gap-1 px-3 pt-1">
                      {Object.entries(formData.hobbyPhotos).map(([hobby, url]) => (
                        <img key={hobby} src={url} alt={hobby} className="w-14 h-14 rounded-lg object-cover" />
                      ))}
                    </div>
                  )}

                  {/* Hobby tags */}
                  {formData.hobbies.length > 0 && (
                    <div className="px-3 pt-2 flex flex-wrap gap-1">
                      {formData.hobbies.slice(0, 6).map((hobby) => (
                        <span key={hobby} className="px-2 py-0.5 rounded-full bg-[#EE964B]/10 text-[#EE964B] text-[10px] lowercase font-semibold">
                          {hobby}
                        </span>
                      ))}
                      {formData.hobbies.length > 6 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#0D3B66]/5 text-[#0D3B66]/50 text-[10px] lowercase font-semibold">
                          +{formData.hobbies.length - 6} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Looking for text */}
                  {formData.lookingFor && (
                    <div className="px-3 pt-2 pb-1.5">
                      <p className="text-[#0D3B66] text-xs lowercase leading-relaxed font-medium line-clamp-2">{formData.lookingFor}</p>
                    </div>
                  )}

                  <div className="h-2.5" />
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
            disabled={saving}
            className="flex-1 bg-[#EE964B] hover:bg-[#EE964B]/90 text-white lowercase py-6 font-bold"
          >
            {step === 4 && Object.keys(formData.hobbyPhotos).length === 0 && !formData.profilePhoto
              ? "skip photos"
              : step === totalSteps
                ? saving ? "saving..." : "finish"
                : "next"}
            {step < totalSteps && <ChevronRight className="ml-2" size={20} />}
          </Button>
        </div>
      </div>
    </div>
  );
}

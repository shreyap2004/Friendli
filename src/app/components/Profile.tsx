import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Pencil, Save, Plus, X, Camera, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import * as api from "@/lib/api";
import { geocodeZip } from "@/lib/geo";

const HOBBIES = [
  "hiking", "reading", "cooking", "gaming", "yoga", "photography",
  "traveling", "music", "art", "sports", "dancing", "writing",
  "movies", "coffee", "fitness", "volunteering"
];

function compressImage(file: File, maxSize: number = 300): Promise<string> {
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

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const hobbyPhotoRef = useRef<HTMLInputElement>(null);
  const [uploadingHobby, setUploadingHobby] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: "",
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
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = () => {
    const user = api.getCurrentUser();
    if (!user) return;
    setProfile({
      name: user.name || "",
      age: user.age || "",
      almaMater: user.almaMater || "",
      gender: user.gender || "",
      city: user.city || "",
      zipCode: user.zipCode || "",
      funFact: user.funFact || "",
      lookingFor: user.lookingFor || "",
      hobbies: user.hobbies || [],
      customHobby: "",
      profilePhoto: user.profilePhoto || "",
      hobbyPhotos: user.hobbyPhotos || {},
    });
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const user = api.getCurrentUser();
      if (!user) return;

      const updateData: Record<string, unknown> = {
        name: profile.name,
        age: profile.age,
        almaMater: profile.almaMater,
        gender: profile.gender,
        city: profile.city,
        zipCode: profile.zipCode,
        funFact: profile.funFact,
        lookingFor: profile.lookingFor,
        hobbies: profile.hobbies,
        profilePhoto: profile.profilePhoto,
        hobbyPhotos: profile.hobbyPhotos,
      };

      let lat = undefined;
      let lng = undefined;
      if (updateData.zipCode) {
        const coords = await geocodeZip(updateData.zipCode as string);
        if (coords) { lat = coords.lat; lng = coords.lng; }
      }
      if (lat !== undefined && lng !== undefined) {
        updateData.lat = lat;
        updateData.lng = lng;
      }

      const result = await api.updateUser(user.id, updateData);
      api.setCurrentUser(result.user);
      setIsEditing(false);
      toast.success("profile updated!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "failed to save";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleHobby = (hobby: string) => {
    setProfile(prev => ({
      ...prev,
      hobbies: prev.hobbies.includes(hobby)
        ? prev.hobbies.filter(h => h !== hobby)
        : [...prev.hobbies, hobby]
    }));
  };

  const addCustomHobby = () => {
    if (profile.customHobby.trim()) {
      setProfile(prev => ({
        ...prev,
        hobbies: [...prev.hobbies, prev.customHobby.toLowerCase().trim()],
        customHobby: ""
      }));
    }
  };

  const removeHobby = (hobby: string) => {
    setProfile(prev => {
      const photos = { ...prev.hobbyPhotos };
      delete photos[hobby];
      return {
        ...prev,
        hobbies: prev.hobbies.filter(h => h !== hobby),
        hobbyPhotos: photos,
      };
    });
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 300);
      setProfile(prev => ({ ...prev, profilePhoto: compressed }));
    } catch {
      toast.error("failed to process image");
    }
  };

  const handleHobbyPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingHobby) return;
    try {
      const compressed = await compressImage(file, 500);
      setProfile(prev => ({
        ...prev,
        hobbyPhotos: { ...prev.hobbyPhotos, [uploadingHobby]: compressed }
      }));
    } catch {
      toast.error("failed to process image");
    }
    setUploadingHobby(null);
  };

  return (
    <div className="flex-1 pb-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-4 pt-5 pb-3 border-b border-[#EE964B]/15">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-[#0D3B66] lowercase">your profile</h1>
            <p className="text-[#EE964B] lowercase text-sm font-semibold">manage your information</p>
          </div>
          <Button
            onClick={() => isEditing ? saveProfile() : setIsEditing(true)}
            disabled={saving}
            className="bg-[#EE964B] hover:bg-[#EE964B]/90 text-white lowercase font-bold text-sm"
            size="sm"
          >
            {isEditing ? (
              <>{saving ? "saving..." : <><Save className="mr-1.5" size={16} />save</>}</>
            ) : (
              <><Pencil className="mr-1.5" size={16} />edit</>
            )}
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Profile Photo */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="flex items-center gap-4">
            <div
              onClick={() => isEditing && profilePhotoRef.current?.click()}
              className={`w-20 h-20 rounded-full border-3 border-[#EE964B] flex items-center justify-center overflow-hidden bg-[#FDFAEC] ${isEditing ? "cursor-pointer" : ""}`}
            >
              {profile.profilePhoto ? (
                <img src={profile.profilePhoto} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <Camera size={24} className="text-[#EE964B]/50" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-black text-[#0D3B66] lowercase">{profile.name}</h2>
              <p className="text-sm text-[#0D3B66]/50 lowercase font-medium">{profile.city}{profile.almaMater ? ` - ${profile.almaMater}` : ""}</p>
              {isEditing && (
                <div className="flex gap-2 mt-1">
                  <button onClick={() => profilePhotoRef.current?.click()} className="text-xs text-[#EE964B] lowercase font-semibold">
                    {profile.profilePhoto ? "change photo" : "add photo"}
                  </button>
                  {profile.profilePhoto && (
                    <button onClick={() => setProfile(prev => ({ ...prev, profilePhoto: "" }))} className="text-xs text-[#F95738] lowercase font-semibold">
                      remove
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <input ref={profilePhotoRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoUpload} />
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-5 space-y-5">
          {/* Basic Info */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-[#EE964B] lowercase border-b border-[#EE964B]/20 pb-2">basic info</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="lowercase text-[#0D3B66] font-semibold text-sm">name</Label>
                {isEditing ? (
                  <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="lowercase bg-[#FDFAEC] border-[#EE964B]/30 text-sm" />
                ) : (
                  <div className="lowercase bg-[#FDFAEC] border border-[#EE964B]/20 rounded-md px-3 py-2 text-[#0D3B66] text-sm font-medium">{profile.name || "not set"}</div>
                )}
              </div>
              <div className="space-y-1">
                <Label className="lowercase text-[#0D3B66] font-semibold text-sm">age</Label>
                {isEditing ? (
                  <Input type="number" value={profile.age} onChange={(e) => setProfile({ ...profile, age: e.target.value })} className="bg-[#FDFAEC] border-[#EE964B]/30 text-sm" />
                ) : (
                  <div className="bg-[#FDFAEC] border border-[#EE964B]/20 rounded-md px-3 py-2 text-[#0D3B66] text-sm font-medium">{profile.age || "not set"}</div>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="lowercase text-[#0D3B66] font-semibold text-sm">alma mater</Label>
              {isEditing ? (
                <Input value={profile.almaMater} onChange={(e) => setProfile({ ...profile, almaMater: e.target.value })} className="lowercase bg-[#FDFAEC] border-[#EE964B]/30 text-sm" />
              ) : (
                <div className="lowercase bg-[#FDFAEC] border border-[#EE964B]/20 rounded-md px-3 py-2 text-[#0D3B66] text-sm font-medium">{profile.almaMater || "not set"}</div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="lowercase text-[#0D3B66] font-semibold text-sm">gender</Label>
                {isEditing ? (
                  <Input value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })} className="lowercase bg-[#FDFAEC] border-[#EE964B]/30 text-sm" />
                ) : (
                  <div className="lowercase bg-[#FDFAEC] border border-[#EE964B]/20 rounded-md px-3 py-2 text-[#0D3B66] text-sm font-medium">{profile.gender || "not set"}</div>
                )}
              </div>
              <div className="space-y-1">
                <Label className="lowercase text-[#0D3B66] font-semibold text-sm">city</Label>
                {isEditing ? (
                  <Input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} className="lowercase bg-[#FDFAEC] border-[#EE964B]/30 text-sm" />
                ) : (
                  <div className="lowercase bg-[#FDFAEC] border border-[#EE964B]/20 rounded-md px-3 py-2 text-[#0D3B66] text-sm font-medium">{profile.city || "not set"}</div>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="lowercase text-[#0D3B66] font-semibold text-sm">zip code <span className="text-[#0D3B66]/40 font-normal">(optional)</span></Label>
              {isEditing ? (
                <Input value={profile.zipCode} onChange={(e) => setProfile({ ...profile, zipCode: e.target.value })} className="bg-[#FDFAEC] border-[#EE964B]/30 text-sm" placeholder="e.g., 90210" />
              ) : (
                <div className="bg-[#FDFAEC] border border-[#EE964B]/20 rounded-md px-3 py-2 text-[#0D3B66] text-sm font-medium">{profile.zipCode || "not set"}</div>
              )}
            </div>
          </div>

          {/* About */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-[#EE964B] lowercase border-b border-[#EE964B]/20 pb-2">about you</h2>
            <div className="space-y-1">
              <Label className="lowercase text-[#0D3B66] font-semibold text-sm">fun fact</Label>
              {isEditing ? (
                <Textarea value={profile.funFact} onChange={(e) => setProfile({ ...profile, funFact: e.target.value })} className="lowercase bg-[#FDFAEC] border-[#EE964B]/30 min-h-20 text-sm" />
              ) : (
                <div className="lowercase bg-[#FDFAEC] border border-[#EE964B]/20 rounded-md px-3 py-2 text-[#0D3B66] text-sm font-medium">{profile.funFact || "not set"}</div>
              )}
            </div>
            <div className="space-y-1">
              <Label className="lowercase text-[#0D3B66] font-semibold text-sm">looking for</Label>
              {isEditing ? (
                <Textarea value={profile.lookingFor} onChange={(e) => setProfile({ ...profile, lookingFor: e.target.value })} className="lowercase bg-[#FDFAEC] border-[#EE964B]/30 min-h-20 text-sm" />
              ) : (
                <div className="lowercase bg-[#FDFAEC] border border-[#EE964B]/20 rounded-md px-3 py-2 text-[#0D3B66] text-sm font-medium">{profile.lookingFor || "not set"}</div>
              )}
            </div>
          </div>

          {/* Hobbies */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-[#EE964B] lowercase border-b border-[#EE964B]/20 pb-2">hobbies & interests</h2>
            {isEditing ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {HOBBIES.map((hobby) => (
                    <button key={hobby} onClick={() => toggleHobby(hobby)}
                      className={`px-3 py-1.5 rounded-full lowercase text-xs transition-all font-semibold ${profile.hobbies.includes(hobby) ? "bg-[#EE964B] text-white" : "bg-white border-2 border-[#0D3B66]/15 text-[#0D3B66] hover:border-[#EE964B]"}`}>
                      {hobby}
                    </button>
                  ))}
                </div>
                <div className="space-y-1.5 pt-1">
                  <Label className="lowercase text-[#0D3B66] font-semibold text-sm">add custom hobby</Label>
                  <div className="flex gap-2">
                    <Input placeholder="e.g., pottery" value={profile.customHobby}
                      onChange={(e) => setProfile({ ...profile, customHobby: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomHobby())}
                      className="lowercase bg-[#FDFAEC] border-[#EE964B]/30 text-sm" />
                    <Button onClick={addCustomHobby} className="bg-[#EE964B] hover:bg-[#EE964B]/90 text-white" size="sm">
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>
                {profile.hobbies.filter(h => !HOBBIES.includes(h)).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {profile.hobbies.filter(h => !HOBBIES.includes(h)).map((hobby) => (
                      <div key={hobby} className="px-3 py-1.5 rounded-full lowercase text-xs bg-[#EE964B] text-white font-semibold flex items-center gap-1.5">
                        {hobby}
                        <button onClick={() => removeHobby(hobby)}><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.hobbies.length > 0 ? (
                  profile.hobbies.map((hobby) => (
                    <span key={hobby} className="px-3 py-1.5 rounded-full lowercase text-xs bg-[#EE964B] text-white font-semibold">
                      {hobby}
                    </span>
                  ))
                ) : (
                  <p className="text-[#0D3B66]/70 lowercase py-1.5 text-sm font-medium">no hobbies added yet</p>
                )}
              </div>
            )}
          </div>

          {/* Hobby Photos */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-[#EE964B] lowercase border-b border-[#EE964B]/20 pb-2">hobby photos</h2>
            {profile.hobbies.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {profile.hobbies.map((hobby) => (
                  <div key={hobby} className="relative">
                    <div
                      onClick={() => {
                        if (!isEditing) return;
                        setUploadingHobby(hobby);
                        hobbyPhotoRef.current?.click();
                      }}
                      className={`aspect-square rounded-xl border-2 ${isEditing ? "border-dashed border-[#EE964B]/30 cursor-pointer hover:border-[#EE964B]" : "border-[#EE964B]/10"} flex flex-col items-center justify-center overflow-hidden bg-[#FDFAEC] transition-colors`}
                    >
                      {profile.hobbyPhotos[hobby] ? (
                        <img src={profile.hobbyPhotos[hobby]} alt={hobby} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <ImagePlus size={18} className="text-[#EE964B]/30 mb-1" />
                          <span className="text-[8px] text-[#0D3B66]/40 lowercase font-semibold">{isEditing ? "add" : "no photo"}</span>
                        </>
                      )}
                    </div>
                    {isEditing && profile.hobbyPhotos[hobby] && (
                      <button
                        onClick={() => setProfile(prev => {
                          const photos = { ...prev.hobbyPhotos };
                          delete photos[hobby];
                          return { ...prev, hobbyPhotos: photos };
                        })}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-[#F95738] rounded-full flex items-center justify-center"
                      >
                        <X size={10} className="text-white" />
                      </button>
                    )}
                    <p className="text-[9px] text-center text-[#0D3B66]/60 lowercase font-semibold mt-1 truncate">{hobby}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#0D3B66]/70 lowercase py-1.5 text-sm font-medium">add hobbies to upload photos</p>
            )}
            <input ref={hobbyPhotoRef} type="file" accept="image/*" className="hidden" onChange={handleHobbyPhotoUpload} />
          </div>
        </div>
      </div>
    </div>
  );
}

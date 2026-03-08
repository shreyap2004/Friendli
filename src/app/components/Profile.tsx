import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Pencil, Save, Plus, X } from "lucide-react";
import { toast } from "sonner";

const HOBBIES = [
  "hiking", "reading", "cooking", "gaming", "yoga", "photography",
  "traveling", "music", "art", "sports", "dancing", "writing",
  "movies", "coffee", "fitness", "volunteering"
];

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    age: "",
    almaMater: "",
    gender: "",
    city: "",
    funFact: "",
    lookingFor: "",
    hobbies: [] as string[],
    customHobby: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = () => {
    const user = JSON.parse(localStorage.getItem('friendli_user') || '{}');
    setProfile({
      name: user.name || "",
      age: user.age || "",
      almaMater: user.almaMater || "",
      gender: user.gender || "",
      city: user.city || "",
      funFact: user.funFact || "",
      lookingFor: user.lookingFor || "",
      hobbies: user.hobbies || [],
      customHobby: ""
    });
  };

  const saveProfile = () => {
    const user = JSON.parse(localStorage.getItem('friendli_user') || '{}');
    const updatedUser = { ...user, ...profile };
    localStorage.setItem('friendli_user', JSON.stringify(updatedUser));
    setIsEditing(false);
    toast.success("profile updated!");
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
    setProfile(prev => ({
      ...prev,
      hobbies: prev.hobbies.filter(h => h !== hobby)
    }));
  };

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-4 pt-5 pb-3 border-b border-[#EE964B]/15">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-[#0D3B66] lowercase">your profile</h1>
            <p className="text-[#EE964B] lowercase text-sm font-semibold">manage your information</p>
          </div>
          <Button
            onClick={() => isEditing ? saveProfile() : setIsEditing(true)}
            className="bg-[#EE964B] hover:bg-[#EE964B]/90 text-white lowercase font-bold text-sm"
            size="sm"
          >
            {isEditing ? (
              <>
                <Save className="mr-1.5" size={16} />
                save
              </>
            ) : (
              <>
                <Pencil className="mr-1.5" size={16} />
                edit
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-4 py-4 space-y-4">
        <div className="bg-white rounded-2xl shadow-lg p-5 space-y-5">
          {/* Basic Info */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-[#EE964B] lowercase border-b border-[#EE964B]/20 pb-2">
              basic info
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="lowercase text-[#0D3B66] font-semibold text-sm">name</Label>
                {isEditing ? (
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="lowercase bg-[#FDFAEC] border-[#EE964B]/30 text-sm"
                  />
                ) : (
                  <p className="text-[#0D3B66] lowercase py-1.5 font-medium text-sm">{profile.name || "not set"}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="lowercase text-[#0D3B66] font-semibold text-sm">age</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                    className="bg-[#FDFAEC] border-[#EE964B]/30 text-sm"
                  />
                ) : (
                  <p className="text-[#0D3B66] py-1.5 font-medium text-sm">{profile.age || "not set"}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="lowercase text-[#0D3B66] font-semibold text-sm">alma mater</Label>
              {isEditing ? (
                <Input
                  value={profile.almaMater}
                  onChange={(e) => setProfile({ ...profile, almaMater: e.target.value })}
                  className="lowercase bg-[#FDFAEC] border-[#EE964B]/30 text-sm"
                />
              ) : (
                <p className="text-[#0D3B66] lowercase py-1.5 font-medium text-sm">{profile.almaMater || "not set"}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="lowercase text-[#0D3B66] font-semibold text-sm">gender</Label>
                {isEditing ? (
                  <Input
                    value={profile.gender}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                    className="lowercase bg-[#FDFAEC] border-[#EE964B]/30 text-sm"
                  />
                ) : (
                  <p className="text-[#0D3B66] lowercase py-1.5 font-medium text-sm">{profile.gender || "not set"}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="lowercase text-[#0D3B66] font-semibold text-sm">city</Label>
                {isEditing ? (
                  <Input
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    className="lowercase bg-[#FDFAEC] border-[#EE964B]/30 text-sm"
                  />
                ) : (
                  <p className="text-[#0D3B66] lowercase py-1.5 font-medium text-sm">{profile.city || "not set"}</p>
                )}
              </div>
            </div>
          </div>

          {/* About */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-[#EE964B] lowercase border-b border-[#EE964B]/20 pb-2">
              about you
            </h2>

            <div className="space-y-1">
              <Label className="lowercase text-[#0D3B66] font-semibold text-sm">fun fact</Label>
              {isEditing ? (
                <Textarea
                  value={profile.funFact}
                  onChange={(e) => setProfile({ ...profile, funFact: e.target.value })}
                  className="lowercase bg-[#FDFAEC] border-[#EE964B]/30 min-h-20 text-sm"
                />
              ) : (
                <p className="text-[#0D3B66] lowercase py-1.5 font-medium text-sm">{profile.funFact || "not set"}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label className="lowercase text-[#0D3B66] font-semibold text-sm">looking for</Label>
              {isEditing ? (
                <Textarea
                  value={profile.lookingFor}
                  onChange={(e) => setProfile({ ...profile, lookingFor: e.target.value })}
                  className="lowercase bg-[#FDFAEC] border-[#EE964B]/30 min-h-20 text-sm"
                />
              ) : (
                <p className="text-[#0D3B66] lowercase py-1.5 font-medium text-sm">{profile.lookingFor || "not set"}</p>
              )}
            </div>
          </div>

          {/* Hobbies */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-[#EE964B] lowercase border-b border-[#EE964B]/20 pb-2">
              hobbies & interests
            </h2>

            {isEditing ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {HOBBIES.map((hobby) => (
                    <button
                      key={hobby}
                      onClick={() => toggleHobby(hobby)}
                      className={`px-3 py-1.5 rounded-full lowercase text-xs transition-all font-semibold ${
                        profile.hobbies.includes(hobby)
                          ? 'bg-[#EE964B] text-white'
                          : 'bg-white border-2 border-[#0D3B66]/15 text-[#0D3B66] hover:border-[#EE964B]'
                      }`}
                    >
                      {hobby}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5 pt-1">
                  <Label className="lowercase text-[#0D3B66] font-semibold text-sm">add custom hobby</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., pottery"
                      value={profile.customHobby}
                      onChange={(e) => setProfile({ ...profile, customHobby: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomHobby())}
                      className="lowercase bg-[#FDFAEC] border-[#EE964B]/30 text-sm"
                    />
                    <Button
                      onClick={addCustomHobby}
                      className="bg-[#EE964B] hover:bg-[#EE964B]/90 text-white"
                      size="sm"
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>

                {profile.hobbies.filter(h => !HOBBIES.includes(h)).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {profile.hobbies.filter(h => !HOBBIES.includes(h)).map((hobby) => (
                      <div
                        key={hobby}
                        className="px-3 py-1.5 rounded-full lowercase text-xs bg-[#EE964B] text-white font-semibold flex items-center gap-1.5"
                      >
                        {hobby}
                        <button onClick={() => removeHobby(hobby)}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.hobbies.length > 0 ? (
                  profile.hobbies.map((hobby) => (
                    <span
                      key={hobby}
                      className="px-3 py-1.5 rounded-full lowercase text-xs bg-[#EE964B] text-white font-semibold"
                    >
                      {hobby}
                    </span>
                  ))
                ) : (
                  <p className="text-[#0D3B66]/70 lowercase py-1.5 text-sm font-medium">no hobbies added yet</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
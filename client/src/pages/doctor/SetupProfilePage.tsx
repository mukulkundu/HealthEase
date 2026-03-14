import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { doctorApi } from "../../api/doctor.api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface FormData {
  specialization: string;
  experience: number;
  consultationFee: number;
  bio: string;
  avatarUrl: string;
}

const BIO_MAX = 500;

export default function SetupProfilePage() {
  const navigate = useNavigate();
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [qualInput, setQualInput] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [langInput, setLangInput] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { experience: 0, consultationFee: 0, bio: "", avatarUrl: "" },
  });

  const bioValue = watch("bio") ?? "";
  const [saving, setSaving] = useState(false);

  const addQualification = () => {
    const v = qualInput.trim();
    if (v && !qualifications.includes(v)) {
      setQualifications((prev) => [...prev, v]);
      setQualInput("");
    }
  };

  const removeQualification = (q: string) => {
    setQualifications((prev) => prev.filter((x) => x !== q));
  };

  const addLanguage = () => {
    const v = langInput.trim();
    if (v && !languages.includes(v)) {
      setLanguages((prev) => [...prev, v]);
      setLangInput("");
    }
  };

  const removeLanguage = (l: string) => {
    setLanguages((prev) => prev.filter((x) => x !== l));
  };

  const onSubmit = async (data: FormData) => {
    if (qualifications.length === 0) {
      toast.error("Add at least one qualification");
      return;
    }
    if (languages.length === 0) {
      toast.error("Add at least one language");
      return;
    }
    setSaving(true);
    try {
      await doctorApi.createProfile({
        specialization: data.specialization.trim(),
        experience: Number(data.experience),
        consultationFee: Number(data.consultationFee),
        qualifications,
        languages,
        bio: data.bio?.trim() || undefined,
        avatarUrl: data.avatarUrl?.trim() || undefined,
      });
      toast.success("Profile created successfully");
      navigate("/doctor/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to create profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Set Up Your Profile</h1>
          <p className="text-gray-500 mt-1">
            Complete your profile so patients can find and book you.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Doctor Profile</CardTitle>
            <CardDescription>
              All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="specialization">Specialization *</Label>
                <Input
                  id="specialization"
                  placeholder="e.g. Cardiology, Dermatology"
                  {...register("specialization", { required: "Specialization is required" })}
                />
                {errors.specialization && (
                  <p className="text-xs text-red-500">{errors.specialization.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="experience">Years of Experience *</Label>
                <Input
                  id="experience"
                  type="number"
                  min={0}
                  max={60}
                  {...register("experience", {
                    required: "Required",
                    min: { value: 0, message: "Min 0" },
                    max: { value: 60, message: "Max 60" },
                    valueAsNumber: true,
                  })}
                />
                {errors.experience && (
                  <p className="text-xs text-red-500">{errors.experience.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="consultationFee">Consultation Fee (₹) *</Label>
                <Input
                  id="consultationFee"
                  type="number"
                  min={0}
                  {...register("consultationFee", {
                    required: "Required",
                    min: { value: 0, message: "Min 0" },
                    valueAsNumber: true,
                  })}
                />
                {errors.consultationFee && (
                  <p className="text-xs text-red-500">{errors.consultationFee.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Qualifications * (e.g. MBBS, MD)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add qualification"
                    value={qualInput}
                    onChange={(e) => setQualInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addQualification())}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addQualification}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {qualifications.map((q) => (
                    <Badge key={q} variant="secondary" className="gap-1">
                      {q}
                      <button
                        type="button"
                        onClick={() => removeQualification(q)}
                        className="hover:bg-muted rounded p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                {qualifications.length === 0 && (
                  <p className="text-xs text-amber-600">Add at least one qualification</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Languages * (e.g. English, Hindi)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add language"
                    value={langInput}
                    onChange={(e) => setLangInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLanguage())}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addLanguage}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {languages.map((l) => (
                    <Badge key={l} variant="secondary" className="gap-1">
                      {l}
                      <button
                        type="button"
                        onClick={() => removeLanguage(l)}
                        className="hover:bg-muted rounded p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                {languages.length === 0 && (
                  <p className="text-xs text-amber-600">Add at least one language</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bio">About You (optional)</Label>
                <textarea
                  id="bio"
                  rows={4}
                  maxLength={BIO_MAX}
                  placeholder="Tell patients about your background, approach, and expertise..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  {...register("bio")}
                />
                <p className="text-xs text-gray-500">{bioValue.length}/{BIO_MAX} characters</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="avatarUrl">Profile Photo URL (optional)</Label>
                <Input
                  id="avatarUrl"
                  type="url"
                  placeholder="https://..."
                  {...register("avatarUrl")}
                />
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  "Create Profile"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

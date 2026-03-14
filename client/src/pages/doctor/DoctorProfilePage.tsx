import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doctorApi } from "../../api/doctor.api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  Star,
  Clock,
  IndianRupee,
  GraduationCap,
  Languages,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import type { DoctorProfile } from "../../types";

const BIO_MAX = 500;

interface EditFormData {
  specialization: string;
  experience: number;
  consultationFee: number;
  bio: string;
  avatarUrl: string;
}

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [qualInput, setQualInput] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [langInput, setLangInput] = useState("");

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<EditFormData>();
  const bioValue = watch("bio") ?? "";

  useEffect(() => {
    doctorApi
      .getMyProfile()
      .then((p) => setProfile(p ?? null))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const openEdit = () => {
    if (!profile) return;
    reset({
      specialization: profile.specialization,
      experience: profile.experience,
      consultationFee: profile.consultationFee,
      bio: profile.bio ?? "",
      avatarUrl: profile.avatarUrl ?? "",
    });
    setQualifications([...profile.qualifications]);
    setLanguages([...profile.languages]);
    setQualInput("");
    setLangInput("");
    setEditOpen(true);
  };

  const addQual = () => {
    const v = qualInput.trim();
    if (v && !qualifications.includes(v)) {
      setQualifications((prev) => [...prev, v]);
      setQualInput("");
    }
  };
  const removeQual = (q: string) => setQualifications((prev) => prev.filter((x) => x !== q));

  const addLang = () => {
    const v = langInput.trim();
    if (v && !languages.includes(v)) {
      setLanguages((prev) => [...prev, v]);
      setLangInput("");
    }
  };
  const removeLang = (l: string) => setLanguages((prev) => prev.filter((x) => x !== l));

  const onEditSubmit = async (data: EditFormData) => {
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
      const updated = await doctorApi.updateProfile({
        specialization: data.specialization.trim(),
        experience: Number(data.experience),
        consultationFee: Number(data.consultationFee),
        qualifications,
        languages,
        bio: data.bio?.trim() || undefined,
        avatarUrl: data.avatarUrl?.trim() || undefined,
      });
      setProfile(updated);
      setEditOpen(false);
      toast.success("Profile updated");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center gap-2 text-gray-500 py-10">
          <Loader2 className="h-6 w-6 animate-spin" /> Loading profile...
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="py-10 text-center text-gray-500">
            <p>No profile found. Complete your profile first.</p>
            <Button className="mt-4" asChild>
              <Link to="/doctor/setup-profile">Set Up Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const name = profile.user?.name ?? "Doctor";
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-500 mt-1">View and edit your public profile</p>
          </div>
          <Button onClick={openEdit}>
            <Pencil className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <Avatar className="h-24 w-24 shrink-0">
                <AvatarImage src={profile.avatarUrl} alt={name} />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <h2 className="text-xl font-bold text-gray-900">Dr. {name}</h2>
                <p className="text-blue-600 font-medium">{profile.specialization}</p>
                {profile.isApproved ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    Pending Approval
                  </Badge>
                )}
                {!profile.isApproved && (
                  <p className="text-sm text-gray-500">Your profile is under review</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>{profile.experience} yr{profile.experience !== 1 ? "s" : ""} exp</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <IndianRupee className="h-4 w-4 text-gray-400" />
                <span>₹{profile.consultationFee}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{profile.rating > 0 ? profile.rating.toFixed(1) : "—"} ({profile.totalReviews} reviews)</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <GraduationCap className="h-4 w-4" /> Qualifications
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.qualifications.map((q) => (
                  <Badge key={q} variant="secondary">{q}</Badge>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Languages className="h-4 w-4" /> Languages
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((l) => (
                  <Badge key={l} variant="outline">{l}</Badge>
                ))}
              </div>
            </div>

            {profile.bio && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">About</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Specialization *</Label>
              <Input
                placeholder="e.g. Cardiology"
                {...register("specialization", { required: "Required" })}
              />
              {errors.specialization && (
                <p className="text-xs text-red-500">{errors.specialization.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Experience (years)</Label>
                <Input
                  type="number"
                  min={0}
                  max={60}
                  {...register("experience", { required: true, min: 0, max: 60, valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Consultation Fee (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  {...register("consultationFee", { required: true, min: 0, valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Qualifications *</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add"
                  value={qualInput}
                  onChange={(e) => setQualInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addQual())}
                />
                <Button type="button" variant="outline" size="sm" onClick={addQual}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {qualifications.map((q) => (
                  <Badge key={q} variant="secondary" className="gap-1">
                    {q}
                    <button type="button" onClick={() => removeQual(q)}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Languages *</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add"
                  value={langInput}
                  onChange={(e) => setLangInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLang())}
                />
                <Button type="button" variant="outline" size="sm" onClick={addLang}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {languages.map((l) => (
                  <Badge key={l} variant="secondary" className="gap-1">
                    {l}
                    <button type="button" onClick={() => removeLang(l)}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>About (optional)</Label>
              <textarea
                maxLength={BIO_MAX}
                className="w-full rounded-md border border-input px-3 py-2 text-sm resize-none"
                {...register("bio")}
              />
              <p className="text-xs text-gray-500">{bioValue.length}/{BIO_MAX}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Profile Photo URL</Label>
              <Input type="url" placeholder="https://..." {...register("avatarUrl")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

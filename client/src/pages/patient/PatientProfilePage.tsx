import { useEffect, useState } from "react";
import { authApi } from "../../api/auth.api";
import { userApi } from "../../api/user.api";
import { useAuthStore } from "../../store/authStore";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Pencil, Lock } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import type { User } from "../../types";

interface EditFormData {
  name: string;
  phone: string;
}

export default function PatientProfilePage() {
  const { user: storeUser, setUser } = useAuthStore();
  const [user, setUserLocal] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditFormData>();

  useEffect(() => {
    authApi
      .me()
      .then((u) => {
        setUserLocal(u ?? null);
        if (u) setUser(u);
      })
      .catch(() => setUserLocal(null))
      .finally(() => setLoading(false));
  }, [setUser]);

  const openEdit = () => {
    if (!user) return;
    reset({
      name: user.name,
      phone: user.phone ?? "",
    });
    setEditOpen(true);
  };

  const onSubmit = async (data: EditFormData) => {
    setSaving(true);
    try {
      const updated = await userApi.updateProfile({
        name: data.name.trim(),
        phone: data.phone?.trim() || undefined,
      });
      setUserLocal(updated);
      setUser(updated);
      setEditOpen(false);
      toast.success("Profile updated successfully");
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

  const profile = user ?? storeUser;
  if (!profile) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="py-10 text-center text-gray-500">
            <p>Could not load profile.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-500 mt-1">View and edit your account details</p>
          </div>
          <Button onClick={openEdit}>
            <Pencil className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <Avatar className="h-20 w-20 shrink-0">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                <p className="text-sm text-gray-500">{profile.email}</p>
                <Badge variant="secondary">Patient</Badge>
              </div>
            </div>

            <dl className="mt-6 pt-6 border-t space-y-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Email
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{profile.email}</dd>
                <p className="text-xs text-gray-400 mt-0.5">Read only</p>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile.phone || "Not provided"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Member since</dt>
                <dd className="mt-1 text-sm text-gray-900">{memberSince}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                placeholder="Your name"
                {...register("name", {
                  required: "Name is required",
                  minLength: { value: 2, message: "At least 2 characters" },
                })}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">Phone (optional)</Label>
              <Input
                id="edit-phone"
                placeholder="+91 XXXXX XXXXX"
                {...register("phone")}
              />
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

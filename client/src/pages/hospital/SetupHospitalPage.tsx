import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { hospitalApi } from "../../api/hospital.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Hospital } from "../../types";

interface FormData {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  description: string;
}

export default function SetupHospitalPage() {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  useEffect(() => {
    hospitalApi
      .getMyHospital()
      .then((h) => {
        setHospital(h);
        reset({
          name: h.name,
          address: h.address,
          city: h.city,
          state: h.state,
          pincode: h.pincode,
          phone: h.phone,
          email: h.email,
          website: h.website ?? "",
          description: h.description ?? "",
        });
      })
      .catch(() => {/* no hospital yet */})
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      if (hospital) {
        await hospitalApi.update(data);
        toast.success("Hospital updated");
      } else {
        const created = await hospitalApi.create(data);
        setHospital(created);
        toast.success("Hospital registered successfully");
      }
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to save hospital");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {hospital ? "Edit Hospital" : "Register Hospital"}
          </h1>
          <p className="text-gray-500 mt-1">
            {hospital ? "Update your hospital information" : "Set up your hospital profile to go live"}
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Hospital Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="name">Hospital Name *</Label>
                  <Input id="name" {...register("name", { required: "Required" })} />
                  {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="address">Address *</Label>
                  <Input id="address" {...register("address", { required: "Required" })} />
                  {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" {...register("city", { required: "Required" })} />
                  {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="state">State *</Label>
                  <Input id="state" {...register("state", { required: "Required" })} />
                  {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input id="pincode" {...register("pincode", { required: "Required" })} />
                  {errors.pincode && <p className="text-xs text-red-500">{errors.pincode.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" {...register("phone", { required: "Required" })} />
                  {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" {...register("email", { required: "Required" })} />
                  {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" placeholder="https://..." {...register("website")} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    placeholder="Brief description of your hospital..."
                    {...register("description")}
                  />
                </div>
              </div>

              <Button type="submit" disabled={saving} className="w-full">
                {saving
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
                  : hospital ? "Update Hospital" : "Register Hospital"
                }
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

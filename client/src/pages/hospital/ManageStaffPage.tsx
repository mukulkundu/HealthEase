import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { staffApi } from "../../api/staff.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, UserPlus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import type { HospitalStaff } from "../../types";

export default function ManageStaffPage() {
  const [staff, setStaff] = useState<HospitalStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    staffApi
      .list()
      .then(setStaff)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setInviting(true);
    try {
      const member = await staffApi.invite(email.trim());
      setStaff((p) => [...p, member]);
      setEmail("");
      toast.success("Staff member added");
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to invite staff");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await staffApi.remove(userId);
      setStaff((p) => p.filter((s) => s.userId !== userId));
      toast.success("Staff member removed");
    } catch {
      toast.error("Failed to remove staff");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-500 mt-1">Add or remove receptionists for your hospital</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Invite Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500 mb-3">
              The user must already have a RECEPTIONIST account registered on HealthEase.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="receptionist@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />
              <Button onClick={handleInvite} disabled={inviting || !email.trim()}>
                {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Invite
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Current Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : staff.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No staff members yet</p>
            ) : (
              <div className="space-y-2">
                {staff.map((s) => (
                  <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.user?.name}</p>
                      <p className="text-xs text-gray-500">{s.user?.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleRemove(s.userId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

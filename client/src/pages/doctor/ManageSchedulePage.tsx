import { useEffect, useState } from "react";
import { scheduleApi } from "../../api/schedule.api";
import { doctorApi } from "../../api/doctor.api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import type { Schedule, DayOfWeek, DoctorProfile } from "../../types";

const DAYS: DayOfWeek[] = [
  "MONDAY", "TUESDAY", "WEDNESDAY",
  "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY",
];

interface ScheduleForm {
  startTime: string;
  endTime: string;
  slotDuration: number;
  bufferTime: number;
}

export default function ManageSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ScheduleForm>({
    defaultValues: { slotDuration: 30, bufferTime: 0 },
  });

  useEffect(() => {
    Promise.all([
      doctorApi.getMyProfile().catch(() => null),
    ]).then(([prof]) => {
      setProfile(prof);
      if (prof) {
        return scheduleApi.getByDoctor(prof.id).then(setSchedules);
      }
    }).finally(() => setLoading(false));
  }, []);

  const openDialog = (day: DayOfWeek) => {
    const existing = schedules.find((s) => s.dayOfWeek === day);
    reset({
      startTime: existing?.startTime || "09:00",
      endTime: existing?.endTime || "17:00",
      slotDuration: existing?.slotDuration || 30,
      bufferTime: existing?.bufferTime || 0,
    });
    setSelectedDay(day);
    setDialogOpen(true);
  };

  const onSubmit = async (data: ScheduleForm) => {
    if (!selectedDay) return;
    setSaving(true);
    try {
      const saved = await scheduleApi.upsert({
        dayOfWeek: selectedDay,
        startTime: data.startTime,
        endTime: data.endTime,
        slotDuration: Number(data.slotDuration),
        bufferTime: Number(data.bufferTime),
      });
      setSchedules((prev) => {
        const exists = prev.find((s) => s.dayOfWeek === selectedDay);
        return exists
          ? prev.map((s) => (s.dayOfWeek === selectedDay ? saved : s))
          : [...prev, saved];
      });
      toast.success(`${selectedDay} schedule saved`);
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save schedule");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (schedule: Schedule) => {
    setDeletingId(schedule.id);
    try {
      await scheduleApi.delete(schedule.id);
      setSchedules((prev) => prev.filter((s) => s.id !== schedule.id));
      toast.success(`${schedule.dayOfWeek} schedule removed`);
    } catch {
      toast.error("Failed to delete schedule");
    } finally {
      setDeletingId(null);
    }
  };

  const getScheduleForDay = (day: DayOfWeek) =>
    schedules.find((s) => s.dayOfWeek === day);

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Schedule</h1>
          <p className="text-gray-500 mt-1">
            Set your weekly availability and slot duration
          </p>
        </div>

        {/* No profile warning */}
        {!loading && !profile && (
          <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              Please complete your doctor profile before setting a schedule.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : (
          <div className="space-y-3">
            {DAYS.map((day) => {
              const schedule = getScheduleForDay(day);
              return (
                <Card key={day}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="w-28 text-sm font-medium text-gray-700 capitalize">
                        {day.charAt(0) + day.slice(1).toLowerCase()}
                      </span>
                      {schedule ? (
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                          <span>{schedule.startTime} – {schedule.endTime}</span>
                          <Badge variant="secondary" className="text-xs">
                            {schedule.slotDuration} min slots
                          </Badge>
                          {schedule.bufferTime > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {schedule.bufferTime} min buffer
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Not set</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant={schedule ? "outline" : "default"}
                        onClick={() => openDialog(day)}
                        disabled={!profile}
                      >
                        {schedule ? "Edit" : <><Plus className="h-3.5 w-3.5 mr-1" /> Add</>}
                      </Button>
                      {schedule && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(schedule)}
                          disabled={deletingId === schedule.id}
                        >
                          {deletingId === schedule.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDay && selectedDay.charAt(0) + selectedDay.slice(1).toLowerCase()} Schedule
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  {...register("startTime", { required: "Required" })}
                />
                {errors.startTime && (
                  <p className="text-xs text-red-500">{errors.startTime.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  {...register("endTime", { required: "Required" })}
                />
                {errors.endTime && (
                  <p className="text-xs text-red-500">{errors.endTime.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="slotDuration">Slot Duration (min)</Label>
                <Input
                  id="slotDuration"
                  type="number"
                  min={5}
                  max={120}
                  step={5}
                  {...register("slotDuration", { required: "Required", min: 5 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bufferTime">Buffer Time (min)</Label>
                <Input
                  id="bufferTime"
                  type="number"
                  min={0}
                  max={60}
                  step={5}
                  {...register("bufferTime")}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
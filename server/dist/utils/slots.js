// Convert "HH:MM" to total minutes
const toMinutes = (time) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
};
// Convert total minutes to "HH:MM"
const toTimeString = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
export const generateSlots = (startTime, endTime, slotDuration, bufferTime) => {
    const slots = [];
    const end = toMinutes(endTime);
    let current = toMinutes(startTime);
    while (current + slotDuration <= end) {
        const slotStart = toTimeString(current);
        const slotEnd = toTimeString(current + slotDuration);
        slots.push({
            startTime: slotStart,
            endTime: slotEnd,
            available: true,
        });
        current += slotDuration + bufferTime;
    }
    return slots;
};
// Mark booked slots as unavailable
export const markBookedSlots = (slots, bookedStartTimes) => {
    return slots.map((slot) => ({
        ...slot,
        available: !bookedStartTimes.includes(slot.startTime),
    }));
};

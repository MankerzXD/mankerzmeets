export interface Slot {
  startTime: string; // "09:00"
  endTime: string;   // "09:30"
  available: boolean;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Returns the current date string ("YYYY-MM-DD") and current minutes from midnight
 * in the target IANA timezone (e.g. "America/Argentina/Buenos_Aires").
 */
export function getNowInTimezone(timezone = "America/Argentina/Buenos_Aires"): {
  todayStr: string;
  currentMinutes: number;
} {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);

    const getPart = (type: string) =>
      parts.find((p) => p.type === type)?.value || "00";

    const year = getPart("year");
    const month = getPart("month");
    const day = getPart("day");
    const hour = Number(getPart("hour")) % 24;
    const minute = Number(getPart("minute"));

    return {
      todayStr: `${year}-${month}-${day}`,
      currentMinutes: hour * 60 + minute,
    };
  } catch {
    const now = new Date();
    return {
      todayStr: now.toISOString().split("T")[0],
      currentMinutes: now.getHours() * 60 + now.getMinutes(),
    };
  }
}

export function generateAvailableSlots({
  dateStr,
  startTime,
  endTime,
  slotDuration = 30,
  bufferTime = 0,
  breakStartTime,
  breakEndTime,
  timezone = "America/Argentina/Buenos_Aires",
  existingBookings = [],
}: {
  dateStr: string; // "YYYY-MM-DD"
  startTime: string; // "09:00"
  endTime: string;   // "18:00"
  slotDuration?: number;
  bufferTime?: number;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
  timezone?: string;
  existingBookings?: Array<{ startTime: string; endTime: string; status: string }>;
}): Slot[] {
  const slots: Slot[] = [];
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  const breakStartMin = breakStartTime ? timeToMinutes(breakStartTime) : null;
  const breakEndMin = breakEndTime ? timeToMinutes(breakEndTime) : null;

  const bookedRanges = existingBookings
    .filter((b) => b.status !== "CANCELLED")
    .map((b) => ({
      start: timeToMinutes(b.startTime),
      end: timeToMinutes(b.endTime),
    }));

  const { todayStr, currentMinutes } = getNowInTimezone(timezone);
  const isToday = dateStr === todayStr;

  let currentMin = startMin;
  const step = slotDuration + bufferTime;

  while (currentMin + slotDuration <= endMin) {
    const slotStart = currentMin;
    const slotEnd = currentMin + slotDuration;

    let isBreak = false;
    if (breakStartMin !== null && breakEndMin !== null) {
      if (slotStart < breakEndMin && slotEnd > breakStartMin) {
        isBreak = true;
      }
    }

    const isBooked = bookedRanges.some(
      (b) => slotStart < b.end && slotEnd > b.start
    );

    const isPast = isToday && slotStart <= currentMinutes + 15;
    const isPastDay = dateStr < todayStr;
    const isAvailable = !isBreak && !isBooked && !isPast && !isPastDay;

    if (!isBreak) {
      slots.push({
        startTime: minutesToTime(slotStart),
        endTime: minutesToTime(slotEnd),
        available: isAvailable,
      });
    }

    currentMin += step;
  }

  return slots;
}

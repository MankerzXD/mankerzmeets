import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDateSpanish } from "@/lib/utils";
import { sendBookingReminderEmail } from "@/lib/emails";

function isAuthorized(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  // If no secret configured in environment (local dev), allow execution
  if (!cronSecret) return true;

  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${cronSecret}`) return true;

  const url = new URL(req.url);
  if (url.searchParams.get("key") === cronSecret) return true;

  // Vercel Cron header
  if (req.headers.get("x-vercel-cron") === "1") return true;

  return false;
}

async function processReminders(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const now = new Date();
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "https://meet.mankerz.xyz"
  ).replace(/\/+$/, "");

  // Find confirmed bookings for active profiles with email reminders enabled
  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      customerEmail: { contains: "@" },
      profile: {
        status: "ACTIVE",
        enableReminders: true,
      },
      OR: [{ reminder24hSent: false }, { reminder2hSent: false }],
    },
    include: {
      profile: {
        select: {
          name: true,
          slug: true,
          whatsapp: true,
          reminderTiming: true,
        },
      },
      service: { select: { name: true } },
      staffMember: { select: { name: true } },
    },
  });

  let sent24h = 0;
  let sent2h = 0;
  let errors = 0;

  for (const booking of bookings) {
    try {
      const [y, m, d] = booking.date.split("-").map(Number);
      const [h, min] = booking.startTime.split(":").map(Number);
      const appointmentDate = new Date(y, m - 1, d, h, min, 0);

      const diffMs = appointmentDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      const timing = booking.profile.reminderTiming || "BOTH";
      const formattedDate = formatDateSpanish(booking.date);
      const manageUrl = booking.cancellationToken
        ? `${appUrl}/${booking.profile.slug}/turno/${booking.cancellationToken}`
        : null;

      // 1. Check 24-hour reminder window (between 20h and 26h before appointment)
      if (
        (timing === "BOTH" || timing === "24H") &&
        !booking.reminder24hSent &&
        diffHours >= 20 &&
        diffHours <= 26
      ) {
        const ok = await sendBookingReminderEmail({
          customerEmail: booking.customerEmail,
          customerName: booking.customerName,
          profileName: booking.profile.name,
          profileSlug: booking.profile.slug,
          whatsapp: booking.profile.whatsapp,
          serviceName: booking.serviceName || booking.service?.name || null,
          staffMemberName:
            booking.staffMemberName || booking.staffMember?.name || null,
          formattedDate,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          managementCode: booking.managementCode,
          manageUrl,
          reminderType: "24H",
        });

        if (ok) {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { reminder24hSent: true },
          });
          sent24h++;
        } else {
          errors++;
        }
      }

      // 2. Check 2-hour reminder window (between 1h and 3h before appointment)
      if (
        (timing === "BOTH" || timing === "2H") &&
        !booking.reminder2hSent &&
        diffHours >= 1 &&
        diffHours <= 3
      ) {
        const ok = await sendBookingReminderEmail({
          customerEmail: booking.customerEmail,
          customerName: booking.customerName,
          profileName: booking.profile.name,
          profileSlug: booking.profile.slug,
          whatsapp: booking.profile.whatsapp,
          serviceName: booking.serviceName || booking.service?.name || null,
          staffMemberName:
            booking.staffMemberName || booking.staffMember?.name || null,
          formattedDate,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          managementCode: booking.managementCode,
          manageUrl,
          reminderType: "2H",
        });

        if (ok) {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { reminder2hSent: true },
          });
          sent2h++;
        } else {
          errors++;
        }
      }
    } catch (bookingErr) {
      console.error(`Error processing reminder for booking ${booking.id}:`, bookingErr);
      errors++;
    }
  }

  return NextResponse.json({
    success: true,
    processedTotal: bookings.length,
    sent24h,
    sent2h,
    errors,
    executedAt: now.toISOString(),
  });
}

export async function GET(req: Request) {
  return processReminders(req);
}

export async function POST(req: Request) {
  return processReminders(req);
}

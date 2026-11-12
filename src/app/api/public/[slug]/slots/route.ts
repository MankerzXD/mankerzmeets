import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAvailableSlots } from "@/lib/time-slots";

export async function GET(
  req: Request,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date"); // "YYYY-MM-DD"

    if (!slug || !dateStr) {
      return NextResponse.json(
        { error: "Parámetros 'slug' y 'date' requeridos" },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { slug: slug.toLowerCase().trim() },
      include: {
        availabilities: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    if (profile.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Este perfil está temporalmente suspendido." },
        { status: 403 }
      );
    }

    const [year, month, day] = dateStr.split("-").map(Number);
    const targetDate = new Date(year, month - 1, day);
    const dayOfWeek = targetDate.getDay();

    const availability = profile.availabilities.find(
      (a) => a.dayOfWeek === dayOfWeek
    );

    if (!availability || !availability.isActive) {
      return NextResponse.json({
        date: dateStr,
        dayOfWeek,
        dayOff: true,
        slots: [],
      });
    }

    const existingBookings = await prisma.booking.findMany({
      where: {
        profileId: profile.id,
        date: dateStr,
        status: { not: "CANCELLED" },
      },
      select: {
        startTime: true,
        endTime: true,
        status: true,
      },
    });

    const slots = generateAvailableSlots({
      dateStr,
      startTime: availability.startTime,
      endTime: availability.endTime,
      slotDuration: profile.slotDuration,
      bufferTime: profile.bufferTime,
      breakStartTime: availability.breakStartTime,
      breakEndTime: availability.breakEndTime,
      timezone: profile.timezone || "America/Argentina/Buenos_Aires",
      existingBookings,
    });

    return NextResponse.json({
      date: dateStr,
      dayOfWeek,
      dayOff: false,
      slots,
    });
  } catch (error) {
    console.error("Error generating slots:", error);
    return NextResponse.json(
      { error: "Error al calcular horarios disponibles" },
      { status: 500 }
    );
  }
}

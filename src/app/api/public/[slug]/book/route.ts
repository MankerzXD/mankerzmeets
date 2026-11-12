import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDateSpanish } from "@/lib/utils";
import { generateAvailableSlots } from "@/lib/time-slots";

export async function POST(
  req: Request,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;
    const body = await req.json();
    const {
      date,
      startTime,
      customerName,
      customerEmail,
      customerPhone,
      notes,
    } = body;

    if (!slug || !date || !startTime || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios para confirmar el turno." },
        { status: 400 }
      );
    }

    const cleanSlug = slug.toLowerCase().trim();
    const profile = await prisma.profile.findUnique({
      where: { slug: cleanSlug },
      include: { availabilities: true },
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

    // Validate day of week and verify requested slot is actually valid & open
    const [year, month, day] = date.split("-").map(Number);
    const targetDate = new Date(year, month - 1, day);
    const dayOfWeek = targetDate.getDay();
    const availability = profile.availabilities.find(
      (a) => a.dayOfWeek === dayOfWeek
    );

    if (!availability || !availability.isActive) {
      return NextResponse.json(
        { error: "El profesional no atiende en la fecha seleccionada." },
        { status: 400 }
      );
    }

    const [startH, startM] = startTime.split(":").map(Number);
    const startTotalMin = startH * 60 + startM;
    const endTotalMin = startTotalMin + profile.slotDuration;
    const endH = Math.floor(endTotalMin / 60)
      .toString()
      .padStart(2, "0");
    const endM = (endTotalMin % 60).toString().padStart(2, "0");
    const endTime = `${endH}:${endM}`;

    // Atomic transaction to prevent double-booking race conditions
    const result = await prisma.$transaction(async (tx) => {
      const existingBookings = await tx.booking.findMany({
        where: {
          profileId: profile.id,
          date,
          status: { not: "CANCELLED" },
        },
        select: {
          startTime: true,
          endTime: true,
          status: true,
        },
      });

      const validSlots = generateAvailableSlots({
        dateStr: date,
        startTime: availability.startTime,
        endTime: availability.endTime,
        slotDuration: profile.slotDuration,
        bufferTime: profile.bufferTime,
        breakStartTime: availability.breakStartTime,
        breakEndTime: availability.breakEndTime,
        timezone: profile.timezone || "America/Argentina/Buenos_Aires",
        existingBookings,
      });

      const chosen = validSlots.find((s) => s.startTime === startTime);
      if (!chosen || !chosen.available) {
        return { conflict: true as const };
      }

      const booking = await tx.booking.create({
        data: {
          profileId: profile.id,
          customerName: customerName.trim(),
          customerEmail: (customerEmail || "").trim(),
          customerPhone: customerPhone.trim(),
          date,
          startTime,
          endTime,
          notes: (notes || "").trim(),
          status: "CONFIRMED",
        },
      });

      return { conflict: false as const, booking };
    });

    if (result.conflict) {
      return NextResponse.json(
        {
          error:
            "Este horario ya no está disponible. Por favor elegí otro horario.",
        },
        { status: 409 }
      );
    }

    const formattedDate = formatDateSpanish(date);
    const professionalPhone = profile.whatsapp.replace(/[^\d]/g, "");
    const waText = encodeURIComponent(
      `¡Hola ${profile.name}!\n\nAcabo de agendar un turno a través de *Mankerz Meet*:\n\n📅 *Fecha:* ${formattedDate}\n⏰ *Horario:* ${startTime} a ${endTime} hs\n👤 *Nombre:* ${customerName}\n📱 *Teléfono:* ${customerPhone}${notes ? `\n📝 *Nota:* ${notes}` : ""}`
    );

    const whatsappUrl =
      professionalPhone.length >= 8
        ? `https://wa.me/${professionalPhone}?text=${waText}`
        : null;

    return NextResponse.json({
      success: true,
      booking: result.booking,
      whatsappUrl,
      message: "¡Turno agendado con éxito!",
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Error al procesar la reserva. Por favor intenta nuevamente." },
      { status: 500 }
    );
  }
}

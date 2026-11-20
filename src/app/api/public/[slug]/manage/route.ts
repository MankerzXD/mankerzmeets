import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDateSpanish } from "@/lib/utils";
import { generateAvailableSlots } from "@/lib/time-slots";
import {
  sendBookingCancelledEmails,
  sendBookingRescheduledEmails,
} from "@/lib/emails";

function evaluatePolicy(
  bookingDate: string,
  startTime: string,
  status: string,
  cancelNoticeHours: number
): { canManage: boolean; reason: string | null; hoursRemaining: number } {
  if (status === "CANCELLED") {
    return {
      canManage: false,
      reason: "Este turno ya se encuentra cancelado.",
      hoursRemaining: 0,
    };
  }

  if (status === "COMPLETED") {
    return {
      canManage: false,
      reason: "Este turno ya figura como completado.",
      hoursRemaining: 0,
    };
  }

  const [y, m, d] = bookingDate.split("-").map(Number);
  const [h, min] = startTime.split(":").map(Number);
  const appointmentDate = new Date(y, m - 1, d, h, min, 0);
  const now = new Date();
  const diffMs = appointmentDate.getTime() - now.getTime();
  const hoursRemaining = diffMs / (1000 * 60 * 60);

  if (hoursRemaining <= 0) {
    return {
      canManage: false,
      reason: "La fecha y horario de este turno ya pasaron.",
      hoursRemaining,
    };
  }

  if (cancelNoticeHours > 0 && hoursRemaining < cancelNoticeHours) {
    return {
      canManage: false,
      reason: `El negocio requiere al menos ${cancelNoticeHours} hora${
        cancelNoticeHours === 1 ? "" : "s"
      } de antelación para cancelar o reprogramar online. Por favor comunicate directamente por WhatsApp.`,
      hoursRemaining,
    };
  }

  return { canManage: true, reason: null, hoursRemaining };
}

export async function GET(
  req: Request,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token")?.trim();
    const code = searchParams.get("code")?.trim().toUpperCase();

    if (!token && !code) {
      return NextResponse.json(
        { error: "Se requiere un token de acceso o código de turno." },
        { status: 400 }
      );
    }

    const cleanSlug = slug.toLowerCase().trim();
    const profile = await prisma.profile.findUnique({
      where: { slug: cleanSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        title: true,
        whatsapp: true,
        address: true,
        addressUrl: true,
        cancelNoticeHours: true,
        timezone: true,
        slotDuration: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil no encontrado." },
        { status: 404 }
      );
    }

    const booking = await prisma.booking.findFirst({
      where: {
        profileId: profile.id,
        ...(token
          ? { cancellationToken: token }
          : { managementCode: code }),
      },
      include: {
        service: true,
        staffMember: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        {
          error:
            "No encontramos ningún turno con los datos ingresados. Verificá el código o enlace.",
        },
        { status: 404 }
      );
    }

    const policy = evaluatePolicy(
      booking.date,
      booking.startTime,
      booking.status,
      profile.cancelNoticeHours ?? 0
    );

    return NextResponse.json({
      booking: {
        id: booking.id,
        managementCode: booking.managementCode,
        cancellationToken: booking.cancellationToken,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        date: booking.date,
        formattedDate: formatDateSpanish(booking.date),
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        depositAmount: booking.depositAmount,
        notes: booking.notes,
        serviceName: booking.serviceName || booking.service?.name || null,
        serviceDuration:
          booking.service?.duration || profile.slotDuration || 30,
        servicePrice: booking.servicePrice ?? booking.service?.price ?? null,
        staffMemberName:
          booking.staffMemberName || booking.staffMember?.name || null,
        staffMemberId: booking.staffMemberId,
      },
      profile: {
        name: profile.name,
        slug: profile.slug,
        title: profile.title,
        whatsapp: profile.whatsapp,
        address: profile.address,
        addressUrl: profile.addressUrl,
        cancelNoticeHours: profile.cancelNoticeHours ?? 0,
      },
      policy: {
        canManage: policy.canManage,
        reason: policy.reason,
        hoursRemaining: Math.round(policy.hoursRemaining * 10) / 10,
        cancelNoticeHours: profile.cancelNoticeHours ?? 0,
      },
    });
  } catch (error) {
    console.error("Error retrieving booking for management:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al consultar el turno." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;
    const body = await req.json();
    const { token, code, action, newDate, newStartTime } = body;

    if (!token && !code) {
      return NextResponse.json(
        { error: "Token o código de turno requerido." },
        { status: 400 }
      );
    }

    if (action !== "CANCEL" && action !== "RESCHEDULE") {
      return NextResponse.json(
        { error: "Acción inválida. Debe ser CANCEL o RESCHEDULE." },
        { status: 400 }
      );
    }

    const cleanSlug = slug.toLowerCase().trim();
    const profile = await prisma.profile.findUnique({
      where: { slug: cleanSlug },
      include: {
        user: { select: { email: true } },
        availabilities: true,
        services: true,
        staffMembers: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil no encontrado." },
        { status: 404 }
      );
    }

    const booking = await prisma.booking.findFirst({
      where: {
        profileId: profile.id,
        ...(token
          ? { cancellationToken: token }
          : { managementCode: code ? code.toUpperCase() : "" }),
      },
      include: {
        service: true,
        staffMember: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "No se encontró el turno especificado." },
        { status: 404 }
      );
    }

    // Verify policy
    const policy = evaluatePolicy(
      booking.date,
      booking.startTime,
      booking.status,
      profile.cancelNoticeHours ?? 0
    );

    if (!policy.canManage) {
      return NextResponse.json(
        { error: policy.reason || "Este turno no puede ser modificado." },
        { status: 400 }
      );
    }

    // ==========================================
    // ACTION: CANCEL
    // ==========================================
    if (action === "CANCEL") {
      const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: "CANCELLED",
        },
      });

      // Dispatch notifications
      const formattedDate = formatDateSpanish(booking.date);
      await sendBookingCancelledEmails({
        ownerEmail: profile.user.email,
        customerEmail: booking.customerEmail,
        staffMemberEmail: booking.staffMember?.email || null,
        profileName: profile.name,
        profileSlug: profile.slug,
        customerName: booking.customerName,
        serviceName: booking.serviceName || booking.service?.name || null,
        staffMemberName:
          booking.staffMemberName || booking.staffMember?.name || null,
        formattedDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
      });

      return NextResponse.json({
        success: true,
        action: "CANCEL",
        message:
          "Turno cancelado exitosamente. El horario ha sido liberado para otros clientes.",
        booking: updated,
      });
    }

    // ==========================================
    // ACTION: RESCHEDULE
    // ==========================================
    if (action === "RESCHEDULE") {
      if (!newDate || !newStartTime) {
        return NextResponse.json(
          { error: "Por favor seleccioná una nueva fecha y horario." },
          { status: 400 }
        );
      }

      // Check if trying to reschedule to the same exact slot
      if (newDate === booking.date && newStartTime === booking.startTime) {
        return NextResponse.json(
          { error: "El turno ya se encuentra asignado a ese día y horario." },
          { status: 400 }
        );
      }

      const effectiveDuration =
        booking.service?.duration || profile.slotDuration || 30;

      const [y, m, d] = newDate.split("-").map(Number);
      const targetDate = new Date(y, m - 1, d);
      const dayOfWeek = targetDate.getDay();
      const availability = profile.availabilities.find(
        (a) => a.dayOfWeek === dayOfWeek
      );

      if (!availability || !availability.isActive) {
        return NextResponse.json(
          { error: "El profesional no atiende en la nueva fecha seleccionada." },
          { status: 400 }
        );
      }

      const [startH, startM] = newStartTime.split(":").map(Number);
      const startTotalMin = startH * 60 + startM;
      const endTotalMin = startTotalMin + effectiveDuration;
      const endH = Math.floor(endTotalMin / 60)
        .toString()
        .padStart(2, "0");
      const endM = (endTotalMin % 60).toString().padStart(2, "0");
      const newEndTime = `${endH}:${endM}`;

      // Check slot availability within a transaction
      const rescheduleResult = await prisma.$transaction(async (tx) => {
        const existingBookings = await tx.booking.findMany({
          where: {
            profileId: profile.id,
            date: newDate,
            id: { not: booking.id }, // Exclude current booking
            status: { not: "CANCELLED" },
          },
          select: {
            startTime: true,
            endTime: true,
            status: true,
            staffMemberId: true,
          },
        });

        const filterBookings = booking.staffMemberId
          ? existingBookings.filter(
              (b) => b.staffMemberId === booking.staffMemberId
            )
          : existingBookings;

        const validSlots = generateAvailableSlots({
          dateStr: newDate,
          startTime: availability.startTime,
          endTime: availability.endTime,
          slotDuration: effectiveDuration,
          bufferTime: profile.bufferTime,
          breakStartTime: availability.breakStartTime,
          breakEndTime: availability.breakEndTime,
          timezone: profile.timezone || "America/Argentina/Buenos_Aires",
          existingBookings: filterBookings,
        });

        const chosenSlot = validSlots.find((s) => s.startTime === newStartTime);
        if (!chosenSlot || !chosenSlot.available) {
          return { conflict: true as const };
        }

        const updated = await tx.booking.update({
          where: { id: booking.id },
          data: {
            date: newDate,
            startTime: newStartTime,
            endTime: newEndTime,
            status: "CONFIRMED",
          },
        });

        return { conflict: false as const, updated };
      });

      if (rescheduleResult.conflict) {
        return NextResponse.json(
          {
            error:
              "El nuevo horario seleccionado ya no está disponible. Por favor elegí otro horario.",
          },
          { status: 409 }
        );
      }

      const appUrl = (
        process.env.NEXT_PUBLIC_APP_URL || "https://meet.mankerz.xyz"
      ).replace(/\/+$/, "");
      const manageUrl = `${appUrl}/${profile.slug}/turno/${booking.cancellationToken}`;

      const oldFormattedDate = formatDateSpanish(booking.date);
      const newFormattedDate = formatDateSpanish(newDate);

      await sendBookingRescheduledEmails({
        ownerEmail: profile.user.email,
        customerEmail: booking.customerEmail,
        staffMemberEmail: booking.staffMember?.email || null,
        profileName: profile.name,
        profileSlug: profile.slug,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        serviceName: booking.serviceName || booking.service?.name || null,
        staffMemberName:
          booking.staffMemberName || booking.staffMember?.name || null,
        oldFormattedDate,
        oldStartTime: booking.startTime,
        newFormattedDate,
        newDate,
        newStartTime,
        newEndTime,
        manageUrl,
        managementCode: booking.managementCode,
      });

      return NextResponse.json({
        success: true,
        action: "RESCHEDULE",
        message: "Turno reprogramado exitosamente.",
        booking: rescheduleResult.updated,
      });
    }

    return NextResponse.json({ error: "Acción desconocida." }, { status: 400 });
  } catch (error) {
    console.error("Error managing booking:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud. Intentá nuevamente." },
      { status: 500 }
    );
  }
}

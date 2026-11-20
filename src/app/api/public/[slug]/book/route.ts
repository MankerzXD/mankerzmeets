import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDateSpanish } from "@/lib/utils";
import { generateAvailableSlots } from "@/lib/time-slots";
import { sendBookingNotificationEmails } from "@/lib/emails";

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
      serviceId,
      staffMemberId,
      customerName,
      customerEmail,
      customerPhone,
      notes,
    } = body;

    if (
      !slug ||
      !date ||
      !startTime ||
      !customerName ||
      !customerPhone ||
      !customerEmail ||
      typeof customerEmail !== "string" ||
      !customerEmail.includes("@")
    ) {
      return NextResponse.json(
        {
          error:
            "Por favor completá tu nombre, WhatsApp y un correo electrónico válido para recibir la confirmación.",
        },
        { status: 400 }
      );
    }

    const cleanSlug = slug.toLowerCase().trim();
    const profile = await prisma.profile.findUnique({
      where: { slug: cleanSlug },
      include: {
        availabilities: true,
        services: { where: { isActive: true } },
        staffMembers: { where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
        user: { select: { email: true } },
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

    // Resolve service & duration
    let selectedService: { id: string; name: string; duration: number; price: number | null } | null = null;
    if (profile.services.length > 0) {
      if (!serviceId) {
        return NextResponse.json(
          { error: "Por favor elegí el tipo de turno o servicio antes de reservar." },
          { status: 400 }
        );
      }
      const matched = profile.services.find((s) => s.id === serviceId);
      if (!matched) {
        return NextResponse.json(
          { error: "El servicio seleccionado ya no está disponible." },
          { status: 400 }
        );
      }
      selectedService = matched;
    }

    const effectiveDuration = selectedService
      ? selectedService.duration
      : profile.slotDuration;

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
    const endTotalMin = startTotalMin + effectiveDuration;
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
          staffMemberId: true,
        },
      });

      const activeStaff = profile.staffMembers;
      let assignedStaff: { id: string; name: string; email: string | null } | null = null;

      if (activeStaff.length === 0) {
        // Solo professional (no staff configured)
        const validSlots = generateAvailableSlots({
          dateStr: date,
          startTime: availability.startTime,
          endTime: availability.endTime,
          slotDuration: effectiveDuration,
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
      } else if (staffMemberId && staffMemberId !== "any") {
        // Client chose a specific staff member
        const chosenStaff = activeStaff.find((s) => s.id === staffMemberId);
        if (!chosenStaff) {
          return { conflict: true as const };
        }

        const staffBookings = existingBookings.filter(
          (b) => b.staffMemberId === chosenStaff.id
        );
        const validSlots = generateAvailableSlots({
          dateStr: date,
          startTime: availability.startTime,
          endTime: availability.endTime,
          slotDuration: effectiveDuration,
          bufferTime: profile.bufferTime,
          breakStartTime: availability.breakStartTime,
          breakEndTime: availability.breakEndTime,
          timezone: profile.timezone || "America/Argentina/Buenos_Aires",
          existingBookings: staffBookings,
        });

        const chosen = validSlots.find((s) => s.startTime === startTime);
        if (!chosen || !chosen.available) {
          return { conflict: true as const };
        }

        assignedStaff = chosenStaff;
      } else {
        // Client chose "Cualquiera disponible" -> find an active staff member who is free
        const candidateStaff = activeStaff.filter((staff) => {
          const staffBookings = existingBookings.filter(
            (b) => b.staffMemberId === staff.id
          );
          const validSlots = generateAvailableSlots({
            dateStr: date,
            startTime: availability.startTime,
            endTime: availability.endTime,
            slotDuration: effectiveDuration,
            bufferTime: profile.bufferTime,
            breakStartTime: availability.breakStartTime,
            breakEndTime: availability.breakEndTime,
            timezone: profile.timezone || "America/Argentina/Buenos_Aires",
            existingBookings: staffBookings,
          });
          const slot = validSlots.find((s) => s.startTime === startTime);
          return slot && slot.available;
        });

        if (candidateStaff.length === 0) {
          return { conflict: true as const };
        }

        // Pick candidate with fewest bookings today for balanced load distribution
        candidateStaff.sort((a, b) => {
          const countA = existingBookings.filter(
            (x) => x.staffMemberId === a.id
          ).length;
          const countB = existingBookings.filter(
            (x) => x.staffMemberId === b.id
          ).length;
          return countA - countB;
        });

        assignedStaff = candidateStaff[0];
      }

      const isDepositRequired =
        profile.depositRequired && Boolean(profile.bankAlias || profile.bankCbu);
      const initialPaymentStatus = isDepositRequired ? "PENDING" : "EXEMPT";

      const booking = await tx.booking.create({
        data: {
          profileId: profile.id,
          serviceId: selectedService ? selectedService.id : null,
          serviceName: selectedService ? selectedService.name : null,
          servicePrice: selectedService?.price ?? null,
          staffMemberId: assignedStaff ? assignedStaff.id : null,
          staffMemberName: assignedStaff ? assignedStaff.name : null,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim(),
          date,
          startTime,
          endTime,
          notes: (notes || "").trim(),
          status: "CONFIRMED",
          paymentStatus: initialPaymentStatus,
          depositAmount: isDepositRequired ? profile.depositAmount : null,
        },
      });

      return { conflict: false as const, booking, assignedStaff, isDepositRequired };
    });

    if (result.conflict) {
      return NextResponse.json(
        {
          error:
            "Este horario ya no está disponible. Por favor elegí otro horario u otro profesional.",
        },
        { status: 409 }
      );
    }

    const formattedDate = formatDateSpanish(date);
    const professionalPhone = profile.whatsapp.replace(/[^\d]/g, "");
    const serviceLine = selectedService
      ? `\n✨ *Turno:* ${selectedService.name} (${selectedService.duration} min)`
      : "";
    const staffLine = result.assignedStaff
      ? `\n💈 *Profesional:* ${result.assignedStaff.name}`
      : "";
    const depositLine =
      result.isDepositRequired && profile.depositAmount
        ? `\n💳 *Seña bancaria ($${profile.depositAmount.toLocaleString("es-AR")}):* Te adjunto el comprobante de transferencia a continuación.`
        : result.isDepositRequired
        ? `\n💳 *Seña bancaria:* Te adjunto el comprobante de transferencia a continuación.`
        : "";

    const waText = encodeURIComponent(
      `¡Hola ${profile.name}!\n\nAcabo de agendar un turno a través de *Mankerz Meet*:${serviceLine}${staffLine}\n📅 *Fecha:* ${formattedDate}\n⏰ *Horario:* ${startTime} a ${endTime} hs\n👤 *Nombre:* ${customerName}\n📱 *Teléfono:* ${customerPhone}${depositLine}${notes ? `\n📝 *Nota:* ${notes}` : ""}`
    );

    const whatsappUrl =
      professionalPhone.length >= 8
        ? `https://wa.me/${professionalPhone}?text=${waText}`
        : null;

    const depositInfo = result.isDepositRequired
      ? {
          required: true,
          amount: profile.depositAmount,
          alias: profile.bankAlias,
          cbu: profile.bankCbu,
          holder: profile.bankHolder,
          notes: profile.depositNotes,
        }
      : null;

    const emailStatus = await sendBookingNotificationEmails({
      ownerEmail: profile.user.email,
      profileName: profile.name,
      profileSlug: profile.slug,
      serviceName: selectedService ? selectedService.name : null,
      staffMemberName: result.assignedStaff ? result.assignedStaff.name : null,
      staffMemberEmail: result.assignedStaff?.email || null,
      depositInfo,
      formattedDate,
      date,
      startTime,
      endTime,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      notes: notes ? notes.trim() : null,
      whatsappUrl,
    });

    return NextResponse.json({
      success: true,
      booking: result.booking,
      depositInfo,
      whatsappUrl,
      emailStatus,
      message: result.isDepositRequired
        ? "¡Turno pre-agendado! Por favor transferí la seña para asegurar tu lugar."
        : "¡Turno agendado con éxito!",
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Error al procesar la reserva. Por favor intenta nuevamente." },
      { status: 500 }
    );
  }
}

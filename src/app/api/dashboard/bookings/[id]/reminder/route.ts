import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateSpanish } from "@/lib/utils";
import { sendBookingReminderEmail } from "@/lib/emails";

export async function POST(
  _req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const { id: bookingId } = await props.params;

    const profile = await prisma.profile.findUnique({
      where: { userId: session.userId },
      select: {
        id: true,
        name: true,
        slug: true,
        whatsapp: true,
        address: true,
        addressUrl: true,
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
        id: bookingId,
        profileId: profile.id,
      },
      include: {
        service: true,
        staffMember: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Turno no encontrado." },
        { status: 404 }
      );
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        { error: "No se puede enviar recordatorio a un turno cancelado." },
        { status: 400 }
      );
    }

    if (
      !booking.customerEmail ||
      !booking.customerEmail.includes("@")
    ) {
      return NextResponse.json(
        { error: "El cliente no tiene un correo electrónico válido registrado." },
        { status: 400 }
      );
    }

    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL || "https://meet.mankerz.xyz"
    ).replace(/\/+$/, "");

    const formattedDate = formatDateSpanish(booking.date);
    const manageUrl = booking.cancellationToken
      ? `${appUrl}/${profile.slug}/turno/${booking.cancellationToken}`
      : null;

    const ok = await sendBookingReminderEmail({
      customerEmail: booking.customerEmail,
      customerName: booking.customerName,
      profileName: profile.name,
      profileSlug: profile.slug,
      whatsapp: profile.whatsapp,
      serviceName: booking.serviceName || booking.service?.name || null,
      staffMemberName:
        booking.staffMemberName || booking.staffMember?.name || null,
      formattedDate,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      managementCode: booking.managementCode,
      manageUrl,
      address: profile.address,
      addressUrl: profile.addressUrl,
      reminderType: "MANUAL",
    });

    if (!ok) {
      return NextResponse.json(
        { error: "No se pudo enviar el correo de recordatorio. Verificá la configuración del servicio." },
        { status: 500 }
      );
    }

    // Mark as sent
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        reminder24hSent: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Recordatorio enviado con éxito a ${booking.customerEmail}.`,
    });
  } catch (error) {
    console.error("Error sending manual booking reminder:", error);
    return NextResponse.json(
      { error: "Error al enviar el recordatorio." },
      { status: 500 }
    );
  }
}

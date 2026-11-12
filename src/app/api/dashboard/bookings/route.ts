import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    const bookings = await prisma.booking.findMany({
      where: { profileId: profile.id },
      orderBy: [
        { date: "asc" },
        { startTime: "asc" },
      ],
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    const { bookingId, status } = await req.json();

    if (!bookingId || !status) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        profileId: profile.id,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("Error updating booking status:", error);
    return NextResponse.json({ error: "Error al actualizar turno" }, { status: 500 });
  }
}


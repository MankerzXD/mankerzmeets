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

    const availabilities = await prisma.availability.findMany({
      where: { profileId: profile.id },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json({ availabilities });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.userId },
    });

    if (!profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    const { schedule } = await req.json();

    if (!Array.isArray(schedule)) {
      return NextResponse.json(
        { error: "Formato de disponibilidad inválido" },
        { status: 400 }
      );
    }

    // Process each day
    for (const item of schedule) {
      const {
        dayOfWeek,
        startTime,
        endTime,
        isActive,
        breakStartTime,
        breakEndTime,
      } = item;

      await prisma.availability.upsert({
        where: {
          profileId_dayOfWeek: {
            profileId: profile.id,
            dayOfWeek: Number(dayOfWeek),
          },
        },
        create: {
          profileId: profile.id,
          dayOfWeek: Number(dayOfWeek),
          startTime: startTime || "09:00",
          endTime: endTime || "18:00",
          isActive: Boolean(isActive),
          breakStartTime: breakStartTime || null,
          breakEndTime: breakEndTime || null,
        },
        update: {
          startTime: startTime || "09:00",
          endTime: endTime || "18:00",
          isActive: Boolean(isActive),
          breakStartTime: breakStartTime || null,
          breakEndTime: breakEndTime || null,
        },
      });
    }

    const updated = await prisma.availability.findMany({
      where: { profileId: profile.id },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json({
      success: true,
      availabilities: updated,
      message: "Disponibilidad guardada correctamente",
    });
  } catch (error) {
    console.error("Error updating availability:", error);
    return NextResponse.json(
      { error: "Error al actualizar la disponibilidad" },
      { status: 500 }
    );
  }
}


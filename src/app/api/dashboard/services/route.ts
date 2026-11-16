import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getOwnedProfileId(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  return profile?.id ?? null;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const profileId = await getOwnedProfileId(session.userId);
    if (!profileId) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    const services = await prisma.service.findMany({
      where: { profileId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const profileId = await getOwnedProfileId(session.userId);
    if (!profileId) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, duration, price } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Ingresá un nombre válido para el tipo de turno (ej. Uñas común)." },
        { status: 400 }
      );
    }

    const parsedDuration = Number(duration);
    if (!Number.isFinite(parsedDuration) || parsedDuration < 5 || parsedDuration > 480) {
      return NextResponse.json(
        { error: "La duración debe estar entre 5 y 480 minutos." },
        { status: 400 }
      );
    }

    const parsedPrice =
      price !== undefined && price !== null && String(price).trim() !== ""
        ? Math.max(0, Math.round(Number(price)))
        : null;

    const count = await prisma.service.count({ where: { profileId } });

    const service = await prisma.service.create({
      data: {
        profileId,
        name: name.trim(),
        description: description ? String(description).trim() || null : null,
        duration: Math.round(parsedDuration),
        price: parsedPrice !== null && Number.isFinite(parsedPrice) ? parsedPrice : null,
        isActive: true,
        sortOrder: count,
      },
    });

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Error al crear el tipo de turno" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const profileId = await getOwnedProfileId(session.userId);
    if (!profileId) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const { id, name, description, duration, price, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "ID de servicio requerido" }, { status: 400 });
    }

    const existing = await prisma.service.findFirst({
      where: { id, profileId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    }

    if (duration !== undefined) {
      const d = Number(duration);
      if (!Number.isFinite(d) || d < 5 || d > 480) {
        return NextResponse.json(
          { error: "La duración debe estar entre 5 y 480 minutos." },
          { status: 400 }
        );
      }
    }

    const parsedPrice =
      price === undefined
        ? undefined
        : price === null || String(price).trim() === ""
        ? null
        : Math.max(0, Math.round(Number(price)));

    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(description !== undefined && {
          description: description ? String(description).trim() : null,
        }),
        ...(duration !== undefined && { duration: Math.round(Number(duration)) }),
        ...(parsedPrice !== undefined && {
          price:
            parsedPrice !== null && Number.isFinite(parsedPrice)
              ? parsedPrice
              : null,
        }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { error: "Error al actualizar el tipo de turno" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const profileId = await getOwnedProfileId(session.userId);
    if (!profileId) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID de servicio requerido" }, { status: 400 });
    }

    const existing = await prisma.service.findFirst({
      where: { id, profileId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    }

    await prisma.service.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { error: "Error al eliminar el tipo de turno" },
      { status: 500 }
    );
  }
}


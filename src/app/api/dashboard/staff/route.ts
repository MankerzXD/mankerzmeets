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

    const staffMembers = await prisma.staffMember.findMany({
      where: { profileId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ staffMembers });
  } catch (error) {
    console.error("Error fetching staff members:", error);
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
    const { name, role, avatarUrl, email, phone } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Ingresá un nombre válido para el profesional (ej. Lucas, Sofía)." },
        { status: 400 }
      );
    }

    const count = await prisma.staffMember.count({ where: { profileId } });

    const staffMember = await prisma.staffMember.create({
      data: {
        profileId,
        name: name.trim(),
        role: role && typeof role === "string" ? role.trim() : null,
        avatarUrl: avatarUrl && typeof avatarUrl === "string" ? avatarUrl.trim() : null,
        email: email && typeof email === "string" && email.includes("@") ? email.trim() : null,
        phone: phone && typeof phone === "string" ? phone.trim() : null,
        sortOrder: count,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      staffMember,
      message: "Profesional agregado con éxito.",
    });
  } catch (error) {
    console.error("Error creating staff member:", error);
    return NextResponse.json(
      { error: "Error al agregar el profesional." },
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
    const { id, name, role, avatarUrl, email, phone, isActive, sortOrder } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID de profesional requerido." }, { status: 400 });
    }

    const existing = await prisma.staffMember.findFirst({
      where: { id, profileId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Profesional no encontrado o no pertenece a tu perfil." },
        { status: 404 }
      );
    }

    const updateData: {
      name?: string;
      role?: string | null;
      avatarUrl?: string | null;
      email?: string | null;
      phone?: string | null;
      isActive?: boolean;
      sortOrder?: number;
    } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2) {
        return NextResponse.json(
          { error: "El nombre debe tener al menos 2 caracteres." },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (role !== undefined) {
      updateData.role = role && typeof role === "string" ? role.trim() : null;
    }

    if (avatarUrl !== undefined) {
      updateData.avatarUrl =
        avatarUrl && typeof avatarUrl === "string" ? avatarUrl.trim() : null;
    }

    if (email !== undefined) {
      updateData.email =
        email && typeof email === "string" && email.includes("@")
          ? email.trim()
          : null;
    }

    if (phone !== undefined) {
      updateData.phone =
        phone && typeof phone === "string" ? phone.trim() : null;
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    if (sortOrder !== undefined && Number.isFinite(Number(sortOrder))) {
      updateData.sortOrder = Number(sortOrder);
    }

    const updated = await prisma.staffMember.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      staffMember: updated,
      message: "Profesional actualizado con éxito.",
    });
  } catch (error) {
    console.error("Error updating staff member:", error);
    return NextResponse.json(
      { error: "Error al actualizar el profesional." },
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
      return NextResponse.json({ error: "ID requerido." }, { status: 400 });
    }

    const existing = await prisma.staffMember.findFirst({
      where: { id, profileId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Profesional no encontrado o no pertenece a tu perfil." },
        { status: 404 }
      );
    }

    await prisma.staffMember.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Profesional eliminado con éxito.",
    });
  } catch (error) {
    console.error("Error deleting staff member:", error);
    return NextResponse.json(
      { error: "Error al eliminar el profesional." },
      { status: 500 }
    );
  }
}

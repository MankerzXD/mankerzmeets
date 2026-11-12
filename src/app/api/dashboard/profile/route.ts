import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const RESERVED_SLUGS = new Set([
  "admin",
  "superadmin",
  "dashboard",
  "login",
  "logout",
  "register",
  "api",
  "auth",
  "settings",
  "public",
  "meet",
  "_next",
]);

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.userId },
      include: {
        availabilities: {
          orderBy: { dayOfWeek: "asc" },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      title,
      bio,
      avatarUrl,
      bannerUrl,
      template,
      whatsapp,
      instagram,
      timezone,
      slotDuration,
      slug,
    } = body;

    const cleanSlug =
      typeof slug === "string"
        ? slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "")
        : undefined;

    if (cleanSlug !== undefined) {
      if (cleanSlug.length < 3) {
        return NextResponse.json(
          {
            error:
              "El enlace público (slug) debe tener al menos 3 caracteres válidos (letras, números o guiones).",
          },
          { status: 400 }
        );
      }

      if (RESERVED_SLUGS.has(cleanSlug)) {
        return NextResponse.json(
          { error: "Ese nombre de enlace está reservado por el sistema." },
          { status: 400 }
        );
      }

      const existing = await prisma.profile.findFirst({
        where: {
          slug: cleanSlug,
          userId: { not: session.userId },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Este nombre de usuario/slug ya está en uso. Elegí otro." },
          { status: 400 }
        );
      }
    }

    const updatedProfile = await prisma.profile.update({
      where: { userId: session.userId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(title !== undefined && { title: title.trim() }),
        ...(bio !== undefined && { bio: bio.trim() }),
        ...(avatarUrl !== undefined && { avatarUrl: avatarUrl ? avatarUrl.trim() : null }),
        ...(bannerUrl !== undefined && { bannerUrl: bannerUrl ? bannerUrl.trim() : null }),
        ...(template !== undefined && { template }),
        ...(whatsapp !== undefined && { whatsapp: whatsapp.replace(/[^\d]/g, "") }),
        ...(instagram !== undefined && { instagram: instagram.replace(/[@\s]/g, "") || null }),
        ...(timezone !== undefined && { timezone }),
        ...(slotDuration !== undefined && { slotDuration: Number(slotDuration) }),
        ...(cleanSlug && { slug: cleanSlug }),
      },
    });

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      message: "Perfil actualizado correctamente",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Error al actualizar perfil" },
      { status: 500 }
    );
  }
}

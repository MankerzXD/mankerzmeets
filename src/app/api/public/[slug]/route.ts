import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;

    if (!slug) {
      return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().trim();

    const profile = await prisma.profile.findUnique({
      where: { slug: cleanSlug },
      select: {
        id: true,
        slug: true,
        name: true,
        title: true,
        bio: true,
        avatarUrl: true,
        bannerUrl: true,
        template: true,
        whatsapp: true,
        instagram: true,
        timezone: true,
        status: true,
        slotDuration: true,
        availabilities: {
          select: {
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            isActive: true,
            breakStartTime: true,
            breakEndTime: true,
          },
          orderBy: { dayOfWeek: "asc" },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error fetching public profile:", error);
    return NextResponse.json(
      { error: "Error de servidor al cargar perfil" },
      { status: 500 }
    );
  }
}


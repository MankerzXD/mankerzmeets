import { NextResponse } from "next/server";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || !isSuperAdmin(session.email)) {
      return NextResponse.json(
        { error: "Acceso denegado. Panel reservado exclusivamente para SuperAdmin." },
        { status: 403 }
      );
    }

    const tenants = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        profile: {
          include: {
            _count: {
              select: { bookings: true },
            },
          },
        },
      },
    });

    const formattedTenants = tenants.map((u) => ({
      userId: u.id,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      profile: u.profile
        ? {
            id: u.profile.id,
            slug: u.profile.slug,
            name: u.profile.name,
            title: u.profile.title,
            whatsapp: u.profile.whatsapp,
            instagram: u.profile.instagram,
            status: u.profile.status,
            template: u.profile.template,
            bookingsCount: u.profile._count.bookings,
          }
        : null,
    }));

    // Platform metrics
    const totalUsers = tenants.length;
    const activeProfiles = tenants.filter(
      (t) => t.profile?.status === "ACTIVE"
    ).length;
    const suspendedProfiles = tenants.filter(
      (t) => t.profile?.status === "SUSPENDED"
    ).length;
    const totalBookings = await prisma.booking.count();

    return NextResponse.json({
      metrics: {
        totalUsers,
        activeProfiles,
        suspendedProfiles,
        totalBookings,
      },
      tenants: formattedTenants,
    });
  } catch (error) {
    console.error("Error fetching tenants for SuperAdmin:", error);
    return NextResponse.json(
      { error: "Error de servidor al cargar inquilinos" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();

    if (!session || !isSuperAdmin(session.email)) {
      return NextResponse.json(
        { error: "Acceso denegado. Exclusivo para SuperAdmin." },
        { status: 403 }
      );
    }

    const { profileId, status } = await req.json();

    if (!profileId || !["ACTIVE", "SUSPENDED"].includes(status)) {
      return NextResponse.json(
        { error: "Datos de actualización inválidos." },
        { status: 400 }
      );
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: profileId },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      message: `Perfil ${status === "ACTIVE" ? "activado" : "suspendido"} con éxito.`,
    });
  } catch (error) {
    console.error("Error updating tenant status:", error);
    return NextResponse.json(
      { error: "Error al modificar estado de la suscripción" },
      { status: 500 }
    );
  }
}


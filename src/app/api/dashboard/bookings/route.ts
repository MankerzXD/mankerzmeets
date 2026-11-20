import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateBookingCode, generateBookingToken } from "@/lib/booking-code";

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
      include: {
        staffMember: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarUrl: true,
            commissionPercentage: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
          },
        },
      },
      orderBy: [
        { date: "desc" },
        { startTime: "desc" },
      ],
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.userId },
      select: { id: true, slotDuration: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      date,
      startTime,
      endTime,
      serviceId,
      staffMemberId,
      servicePrice,
      status,
      notes,
    } = body;

    if (!date || !startTime) {
      return NextResponse.json(
        { error: "La fecha y hora de inicio son obligatorias." },
        { status: 400 }
      );
    }

    // Look up service if provided
    let sName: string | null = null;
    let sPrice: number | null = servicePrice !== undefined && servicePrice !== null && servicePrice !== ""
      ? Math.max(0, Math.round(Number(servicePrice)))
      : null;
    let sDuration = profile.slotDuration || 30;

    if (serviceId) {
      const s = await prisma.service.findFirst({
        where: { id: serviceId, profileId: profile.id },
      });
      if (s) {
        sName = s.name;
        sDuration = s.duration;
        if (sPrice === null && s.price !== null) {
          sPrice = s.price;
        }
      }
    }

    // Look up staff member if provided
    let staffName: string | null = null;
    if (staffMemberId) {
      const sm = await prisma.staffMember.findFirst({
        where: { id: staffMemberId, profileId: profile.id },
      });
      if (sm) {
        staffName = sm.name;
      }
    }

    // Compute endTime if not provided
    let calculatedEndTime = endTime;
    if (!calculatedEndTime && startTime) {
      const [h, m] = startTime.split(":").map(Number);
      const totalMinutes = h * 60 + m + sDuration;
      const endH = String(Math.floor(totalMinutes / 60) % 24).padStart(2, "0");
      const endM = String(totalMinutes % 60).padStart(2, "0");
      calculatedEndTime = `${endH}:${endM}`;
    }

    const newBooking = await prisma.booking.create({
      data: {
        profileId: profile.id,
        customerName: (customerName || "Cliente en local").trim(),
        customerPhone: (customerPhone || "").trim(),
        customerEmail: (customerEmail || "").trim(),
        date,
        startTime,
        endTime: calculatedEndTime || startTime,
        serviceId: serviceId || null,
        serviceName: sName,
        servicePrice: sPrice,
        staffMemberId: staffMemberId || null,
        staffMemberName: staffName,
        status: status || "COMPLETED",
        paymentStatus: "EXEMPT",
        notes: notes ? notes.trim() : null,
        managementCode: generateBookingCode(),
        cancellationToken: generateBookingToken(),
      },
      include: {
        staffMember: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarUrl: true,
            commissionPercentage: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      booking: newBooking,
      message: "Turno registrado con éxito.",
    });
  } catch (error) {
    console.error("Error creating manual booking:", error);
    return NextResponse.json(
      { error: "Error al registrar el turno manual." },
      { status: 500 }
    );
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

    const { bookingId, status, paymentStatus, staffMemberId, servicePrice } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: "ID de turno requerido" }, { status: 400 });
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

    const updateData: {
      status?: string;
      paymentStatus?: string;
      staffMemberId?: string | null;
      staffMemberName?: string | null;
      servicePrice?: number | null;
    } = {};

    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    if (servicePrice !== undefined) {
      updateData.servicePrice =
        servicePrice !== null && servicePrice !== ""
          ? Math.max(0, Math.round(Number(servicePrice)))
          : null;
    }

    if (staffMemberId !== undefined) {
      if (staffMemberId === null || staffMemberId === "") {
        updateData.staffMemberId = null;
        updateData.staffMemberName = null;
      } else {
        const staff = await prisma.staffMember.findFirst({
          where: { id: staffMemberId, profileId: profile.id },
        });
        if (staff) {
          updateData.staffMemberId = staff.id;
          updateData.staffMemberName = staff.name;
        }
      }
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        staffMember: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarUrl: true,
            commissionPercentage: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("Error updating booking status:", error);
    return NextResponse.json({ error: "Error al actualizar turno" }, { status: 500 });
  }
}


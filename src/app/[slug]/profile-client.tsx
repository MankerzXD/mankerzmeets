"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  Phone,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Share2,
  Check,
  User,
  Users,
  ArrowRight,
  CalendarCheck,
  MessageCircle,
  Copy,
  CreditCard,
  RotateCcw,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { InstagramIcon } from "@/components/icons";
import { formatDateSpanish } from "@/lib/utils";

interface PublicAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface PublicService {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number | null;
}

interface PublicStaffMember {
  id: string;
  name: string;
  role: string | null;
  avatarUrl: string | null;
}

interface PublicProfile {
  id: string;
  slug: string;
  name: string;
  title: string;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  template: string;
  whatsapp: string;
  instagram: string | null;
  address?: string | null;
  addressUrl?: string | null;
  timezone?: string;
  status: string;
  slotDuration: number;
  depositRequired?: boolean;
  depositPercentage?: number | null;
  depositAmount?: number | null;
  bankAlias?: string | null;
  bankCbu?: string | null;
  bankHolder?: string | null;
  depositNotes?: string | null;
  availabilities: PublicAvailability[];
  services?: PublicService[];
  staffMembers?: PublicStaffMember[];
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

function getTodayStrInTimezone(timezone = "America/Argentina/Buenos_Aires"): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

export default function ProfileClient({ slug }: { slug: string }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedStaffMemberId, setSelectedStaffMemberId] = useState<string>("any");

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    booking: {
      id: string;
      date: string;
      startTime: string;
      endTime: string;
      serviceName?: string | null;
      staffMemberName?: string | null;
      managementCode?: string | null;
      cancellationToken?: string | null;
    };
    managementCode?: string | null;
    cancellationToken?: string | null;
    manageUrl?: string | null;
    whatsappUrl: string | null;
    depositInfo?: {
      required: boolean;
      amount: number | null;
      percentage?: number | null;
      alias: string | null;
      cbu: string | null;
      holder: string | null;
      notes: string | null;
    } | null;
  } | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [copiedBookingCode, setCopiedBookingCode] = useState(false);

  useEffect(() => {
    if (!slug) return;

    async function fetchProfile() {
      try {
        setLoadingProfile(true);
        const res = await fetch(`/api/public/${slug}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Perfil no encontrado");
        }

        setProfile(data.profile);
        if (data.profile?.services?.length > 0) {
          setSelectedServiceId(data.profile.services[0].id);
        }
      } catch (err: unknown) {
        setProfileError(
          err instanceof Error ? err.message : "Error al cargar perfil"
        );
      } finally {
        setLoadingProfile(false);
      }
    }

    fetchProfile();
  }, [slug]);

  useEffect(() => {
    if (!slug || !selectedDateStr) return;

    async function fetchSlots() {
      try {
        setLoadingSlots(true);
        setSelectedSlot(null);
        const serviceQuery = selectedServiceId
          ? `&serviceId=${encodeURIComponent(selectedServiceId)}`
          : "";
        const staffQuery =
          selectedStaffMemberId && selectedStaffMemberId !== "any"
            ? `&staffMemberId=${encodeURIComponent(selectedStaffMemberId)}`
            : "";
        const res = await fetch(
          `/api/public/${slug}/slots?date=${selectedDateStr}${serviceQuery}${staffQuery}`
        );
        const data = await res.json();
        if (res.ok) {
          setSlots(data.slots || []);
        } else {
          setSlots([]);
        }
      } catch (err) {
        console.error("Error fetching slots:", err);
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [slug, selectedDateStr, selectedServiceId, selectedStaffMemberId]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = useMemo(() => {
    return new Intl.DateTimeFormat("es-ES", {
      month: "long",
      year: "numeric",
    }).format(currentDate);
  }, [currentDate]);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const todayStr = getTodayStrInTimezone(
      profile?.timezone || "America/Argentina/Buenos_Aires"
    );

    const activeDaysSet = new Set(
      profile?.availabilities
        ?.filter((a) => a.isActive)
        .map((a) => a.dayOfWeek) || []
    );

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      dayOfWeek: number;
      isPast: boolean;
      isActiveDay: boolean;
      isToday: boolean;
    }> = [];

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dOfWeek = dateObj.getDay();
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;

      const isPast = dateStr < todayStr;
      const isToday = dateStr === todayStr;
      const isActiveDay = !isPast && activeDaysSet.has(dOfWeek);

      days.push({
        dateStr,
        dayNumber: day,
        dayOfWeek: dOfWeek,
        isPast,
        isActiveDay,
        isToday,
      });
    }

    return {
      firstDayOffset: firstDayOfMonth,
      days,
    };
  }, [year, month, profile]);

  const handlePrevMonth = () => {
    const today = new Date();
    if (year === today.getFullYear() && month <= today.getMonth()) return;
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDateStr(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDateStr(null);
  };

  const handleCopyProfileUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyAlias = (alias: string) => {
    navigator.clipboard.writeText(alias);
    setCopiedAlias(true);
    setTimeout(() => setCopiedAlias(false), 2000);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDateStr || !selectedSlot) return;

    if (!customerName || !customerPhone || !customerEmail || !customerEmail.includes("@")) {
      setBookingError("Por favor completá tu nombre, WhatsApp y un correo electrónico válido.");
      return;
    }

    setSubmittingBooking(true);
    setBookingError(null);

    try {
      const res = await fetch(`/api/public/${slug}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDateStr,
          startTime: selectedSlot.startTime,
          serviceId: selectedServiceId,
          staffMemberId: selectedStaffMemberId,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo confirmar el turno");
      }

      setBookingResult({
        booking: data.booking,
        managementCode: data.managementCode || data.booking?.managementCode,
        cancellationToken: data.cancellationToken || data.booking?.cancellationToken,
        manageUrl: data.manageUrl,
        whatsappUrl: data.whatsappUrl,
        depositInfo: data.depositInfo,
      });
    } catch (err: unknown) {
      setBookingError(
        err instanceof Error ? err.message : "Error al procesar reserva"
      );
    } finally {
      setSubmittingBooking(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-300 mb-2" />
        <span className="text-xs font-mono">Cargando perfil...</span>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4 text-center">
        <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-7 max-w-sm w-full">
          <AlertCircle className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
          <h1 className="text-base font-bold text-white mb-1.5">
            Perfil no encontrado
          </h1>
          <p className="text-xs text-zinc-400 mb-5 font-light">
            El perfil al que intentas acceder no existe o fue modificado.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-zinc-950 font-medium text-xs hover:bg-zinc-200 transition"
          >
            <span>Ir a Mankerz Meet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  if (profile.status === "SUSPENDED") {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4 text-center">
        <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-7 max-w-sm w-full">
          <Clock className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
          <h1 className="text-base font-bold text-white mb-1">{profile.name}</h1>
          <p className="text-xs text-zinc-400 mb-4 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
            Este perfil de atención se encuentra temporalmente inactivo.
          </p>
          <p className="text-xs text-zinc-500 font-light">
            Por favor, contáctate directamente por sus canales habituales.
          </p>
        </div>
      </div>
    );
  }

  // Template theme tokens: MINIMAL_DARK vs CLEAN_EDITORIAL (light paper mode)
  const isEditorial = profile.template === "CLEAN_EDITORIAL";

  const theme = isEditorial
    ? {
        pageBg: "bg-[#fafaf9] text-zinc-900 selection:bg-zinc-200",
        bannerBg: "bg-zinc-200 border-b border-zinc-200",
        bannerImgOpacity: "opacity-75",
        shareBtn: "bg-white/80 hover:bg-white text-zinc-700 border-zinc-200",
        avatarBorder: "bg-[#fafaf9] border-zinc-200",
        avatarInner: "bg-zinc-100 text-zinc-500",
        socialBtn: "bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200",
        titleText: "text-zinc-950",
        subText: "text-zinc-600",
        mutedText: "text-zinc-500",
        cardBg: "border-zinc-200 bg-white shadow-sm",
        cardActiveBorder: "border-zinc-300 bg-white shadow-sm",
        summaryBg: "bg-zinc-50 border-zinc-200",
        primaryBtn: "bg-zinc-950 text-white hover:bg-zinc-800",
        secondaryBtn: "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100",
        divider: "border-zinc-200",
        navHover: "hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900",
        dayDisabled: "text-zinc-300 opacity-60 cursor-not-allowed",
        daySelected: "bg-zinc-950 text-white font-bold",
        dayActive: "text-zinc-900 hover:bg-zinc-100",
        dayDot: "bg-zinc-900",
        dotOff: "bg-zinc-200",
        durationBadge: "text-zinc-600 bg-zinc-100 border-zinc-200",
        slotDisabled: "bg-zinc-50 border-zinc-100 text-zinc-300 opacity-60 cursor-not-allowed",
        slotSelected: "bg-zinc-950 border-zinc-950 text-white font-bold",
        slotOpen: "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-400",
        inputCls: "bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:bg-white outline-none",
        footerText: "text-zinc-400",
        footerLink: "text-zinc-500 hover:text-zinc-900",
        footerBrand: "text-zinc-700",
      }
    : {
        pageBg: "bg-[#09090b] text-zinc-100 selection:bg-zinc-800",
        bannerBg: "bg-zinc-900 border-b border-zinc-800",
        bannerImgOpacity: "opacity-40",
        shareBtn: "bg-black/60 hover:bg-black/90 text-zinc-300 border-zinc-800",
        avatarBorder: "bg-[#09090b] border-zinc-800",
        avatarInner: "bg-zinc-800 text-zinc-400",
        socialBtn: "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 border-zinc-800",
        titleText: "text-white",
        subText: "text-zinc-400",
        mutedText: "text-zinc-500",
        cardBg: "border-zinc-800 bg-[#121215]",
        cardActiveBorder: "border-zinc-700 bg-[#121215]",
        summaryBg: "bg-zinc-900/60 border-zinc-800/80",
        primaryBtn: "bg-white text-zinc-950 hover:bg-zinc-200",
        secondaryBtn: "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800",
        divider: "border-zinc-800/80",
        navHover: "hover:bg-zinc-800 text-zinc-400 hover:text-white",
        dayDisabled: "text-zinc-700 opacity-40 cursor-not-allowed",
        daySelected: "bg-white text-zinc-950 font-bold",
        dayActive: "text-zinc-200 hover:bg-zinc-800/80",
        dayDot: "bg-zinc-500",
        dotOff: "bg-zinc-800",
        durationBadge: "text-zinc-400 bg-zinc-900 border-zinc-800",
        slotDisabled: "bg-zinc-950 border-zinc-900 text-zinc-700 opacity-40 cursor-not-allowed",
        slotSelected: "bg-white border-white text-zinc-950 font-bold",
        slotOpen: "bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700",
        inputCls: "minimal-input text-white placeholder-zinc-500",
        footerText: "text-zinc-600",
        footerLink: "text-zinc-500 hover:text-zinc-300",
        footerBrand: "text-zinc-300",
      };

  const hasWhatsapp = profile.whatsapp && profile.whatsapp.replace(/[^\d]/g, "").length >= 8;
  const activeServices = profile.services || [];
  const selectedService =
    activeServices.find((s) => s.id === selectedServiceId) ||
    activeServices[0] ||
    null;
  const effectiveDuration = selectedService
    ? selectedService.duration
    : profile.slotDuration;
  const activeStaffMembers = profile.staffMembers || [];
  const selectedStaff =
    activeStaffMembers.find((s) => s.id === selectedStaffMemberId) || null;

  return (
    <div className={`min-h-screen flex flex-col items-center pb-14 ${theme.pageBg}`}>
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col">
        {/* Banner Area */}
        <div className={`relative h-32 sm:h-36 w-full overflow-hidden ${theme.bannerBg}`}>
          {profile.bannerUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.bannerUrl}
              alt="Banner"
              className={`w-full h-full object-cover ${theme.bannerImgOpacity}`}
            />
          )}

          <Link
            href={`/${profile.slug}/turno`}
            title="Consultar o gestionar turno"
            className={`absolute top-3.5 left-3.5 px-3 py-1.5 rounded-full backdrop-blur-md border text-xs font-medium transition shadow-sm flex items-center gap-1.5 ${theme.shareBtn}`}
          >
            <RotateCcw className="w-3 h-3 text-zinc-400" />
            <span>Mi turno</span>
          </Link>

          <button
            onClick={handleCopyProfileUrl}
            title="Compartir perfil"
            className={`absolute top-3.5 right-3.5 p-2 rounded-full backdrop-blur-md border transition shadow-sm ${theme.shareBtn}`}
          >
            {copiedLink ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Profile Info Header */}
        <div className="px-5 -mt-10 relative z-10">
          <div className="flex items-end justify-between">
            <div className={`w-20 h-20 rounded-2xl p-1 border shadow-lg overflow-hidden ${theme.avatarBorder}`}>
              <div className={`w-full h-full rounded-[12px] flex items-center justify-center overflow-hidden ${theme.avatarInner}`}>
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 mb-1">
              {profile.instagram && (
                <a
                  href={`https://instagram.com/${profile.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-xl border transition ${theme.socialBtn}`}
                  title="Instagram"
                >
                  <InstagramIcon className="w-3.5 h-3.5" />
                </a>
              )}
              {hasWhatsapp && (
                <a
                  href={`https://wa.me/${profile.whatsapp.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-xl border transition ${theme.socialBtn}`}
                  title="WhatsApp"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          <div className="mt-3">
            <h1 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${theme.titleText}`}>
              <span>{profile.name}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </h1>
            <p className={`text-xs font-medium mt-0.5 ${theme.subText}`}>
              {profile.title}
            </p>
            {profile.bio && (
              <p className={`text-xs mt-2 leading-relaxed font-light ${theme.subText}`}>
                {profile.bio}
              </p>
            )}
            {profile.address && (
              <div className="mt-2.5">
                <a
                  href={
                    profile.addressUrl
                      ? profile.addressUrl
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          profile.address
                        )}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition ${theme.socialBtn}`}
                  title="Abrir ubicación en Google Maps"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-medium underline decoration-zinc-700/60 underline-offset-2">
                    {profile.address}
                  </span>
                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* BOOKING CONTAINER */}
        <div className="mt-6 px-4 flex-1">
          {bookingResult ? (
            <div className={`rounded-2xl p-6 border text-center my-4 animate-fade-in ${theme.cardBg}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${theme.summaryBg}`}>
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <h2 className={`text-base font-bold ${theme.titleText}`}>¡Turno Agendado!</h2>
              <p className={`text-xs mt-0.5 font-light ${theme.subText}`}>
                Tu reserva quedó registrada. Te enviamos la confirmación por correo electrónico.
              </p>

              <div className={`mt-4 p-4 rounded-xl border text-left space-y-2 text-xs ${theme.summaryBg}`}>
                <div className="flex justify-between">
                  <span className={theme.mutedText}>Profesional:</span>
                  <span className={`font-medium ${theme.titleText}`}>{profile.name}</span>
                </div>
                {bookingResult.booking.serviceName && (
                  <div className="flex justify-between">
                    <span className={theme.mutedText}>Tipo de turno:</span>
                    <span className={`font-medium ${theme.titleText}`}>
                      {bookingResult.booking.serviceName}
                    </span>
                  </div>
                )}
                {bookingResult.booking.staffMemberName && (
                  <div className="flex justify-between">
                    <span className={theme.mutedText}>Atendido por:</span>
                    <span className={`font-medium ${theme.titleText}`}>
                      {bookingResult.booking.staffMemberName}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className={theme.mutedText}>Fecha:</span>
                  <span className={`font-medium capitalize ${theme.titleText}`}>
                    {formatDateSpanish(bookingResult.booking.date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={theme.mutedText}>Horario:</span>
                  <span className={`font-mono font-semibold ${theme.titleText}`}>
                    {bookingResult.booking.startTime} a {bookingResult.booking.endTime} hs
                  </span>
                </div>
                {profile.address && (
                  <div className="flex justify-between items-center pt-1 border-t border-zinc-800/40">
                    <span className={theme.mutedText}>Ubicación:</span>
                    <a
                      href={
                        profile.addressUrl
                          ? profile.addressUrl
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              profile.address
                            )}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[200px]">{profile.address}</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </a>
                  </div>
                )}
              </div>

              {/* BOOKING CODE BANNER */}
              {(bookingResult.managementCode || bookingResult.booking.managementCode) && (
                <div className="mt-4 p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/80 text-left flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] text-zinc-400 uppercase tracking-wider">
                      Código de seguimiento
                    </span>
                    <span className="text-base font-mono font-bold text-white tracking-widest">
                      {bookingResult.managementCode || bookingResult.booking.managementCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const code = (bookingResult.managementCode || bookingResult.booking.managementCode)!;
                      navigator.clipboard.writeText(code);
                      setCopiedBookingCode(true);
                      setTimeout(() => setCopiedBookingCode(false), 2000);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-[11px] font-medium transition flex items-center gap-1 cursor-pointer"
                  >
                    {copiedBookingCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedBookingCode ? "Copiado" : "Copiar"}</span>
                  </button>
                </div>
              )}

              {/* DEPOSIT TRANSFER DETAILS */}
              {bookingResult.depositInfo?.required && (
                <div className="mt-4 p-4 rounded-xl border border-amber-900/50 bg-amber-950/20 text-left space-y-2.5">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
                    <CreditCard className="w-4 h-4 shrink-0" />
                    <span>
                      Paso importante: Seña requerida
                      {bookingResult.depositInfo.amount
                        ? ` ($${bookingResult.depositInfo.amount.toLocaleString("es-AR")}${bookingResult.depositInfo.percentage ? ` — ${bookingResult.depositInfo.percentage}%` : ""})`
                        : bookingResult.depositInfo.percentage
                        ? ` (${bookingResult.depositInfo.percentage}%)`
                        : ""}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed font-light">
                    Para confirmar definitivamente tu turno, transferí la seña y adjuntá el comprobante al enviarle un mensaje por WhatsApp:
                  </p>

                  {bookingResult.depositInfo.alias && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-amber-900/40">
                      <div>
                        <span className="block text-[10px] text-zinc-400 uppercase tracking-wide">Alias</span>
                        <span className="text-xs font-mono font-bold text-white selection:bg-amber-500">
                          {bookingResult.depositInfo.alias}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyAlias(bookingResult.depositInfo!.alias!)}
                        className="px-2.5 py-1 rounded-md bg-amber-400 text-zinc-950 hover:bg-amber-300 text-[11px] font-medium transition flex items-center gap-1 cursor-pointer"
                      >
                        {copiedAlias ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedAlias ? "Copiado" : "Copiar"}</span>
                      </button>
                    </div>
                  )}

                  {bookingResult.depositInfo.holder && (
                    <div className="text-[11px] text-zinc-300 flex justify-between">
                      <span className="text-zinc-500">Titular:</span>
                      <span className="font-medium text-white">{bookingResult.depositInfo.holder}</span>
                    </div>
                  )}

                  {bookingResult.depositInfo.cbu && (
                    <div className="text-[11px] text-zinc-300 flex justify-between font-mono">
                      <span className="text-zinc-500">CBU / CVU:</span>
                      <span className="text-zinc-200">{bookingResult.depositInfo.cbu}</span>
                    </div>
                  )}

                  {bookingResult.depositInfo.notes && (
                    <p className="text-[11px] text-zinc-400 italic pt-1 border-t border-amber-900/30">
                      &ldquo;{bookingResult.depositInfo.notes}&rdquo;
                    </p>
                  )}
                </div>
              )}

              <div className="mt-5 space-y-2">
                {bookingResult.whatsappUrl && (
                  <a
                    href={bookingResult.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-3 px-4 rounded-xl font-medium text-xs transition flex items-center justify-center gap-2 ${theme.primaryBtn}`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>
                      {bookingResult.depositInfo?.required
                        ? "Enviar comprobante por WhatsApp"
                        : "Avisar por WhatsApp"}
                    </span>
                  </a>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                      bookingResult.booking.serviceName
                        ? `${bookingResult.booking.serviceName} — ${profile.name}`
                        : `Turno con ${profile.name}`
                    )}&dates=${bookingResult.booking.date.replace(/-/g, "")}T${bookingResult.booking.startTime.replace(
                      /:/g,
                      ""
                    )}00/${bookingResult.booking.date.replace(/-/g, "")}T${bookingResult.booking.endTime.replace(
                      /:/g,
                      ""
                    )}00&details=${encodeURIComponent(
                      `Turno agendado en meet.mankerz.xyz/${profile.slug}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition ${theme.secondaryBtn}`}
                  >
                    <CalendarIcon className="w-3 h-3" />
                    <span>Google Calendar</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      const startClean = `${bookingResult.booking.date.replace(/-/g, "")}T${bookingResult.booking.startTime.replace(/:/g, "")}00`;
                      const endClean = `${bookingResult.booking.date.replace(/-/g, "")}T${bookingResult.booking.endTime.replace(/:/g, "")}00`;
                      const eventTitle = bookingResult.booking.serviceName
                        ? `${bookingResult.booking.serviceName} — ${profile.name}`
                        : `Turno con ${profile.name}`;
                      const icsContent = [
                        "BEGIN:VCALENDAR",
                        "VERSION:2.0",
                        "PRODID:-//Mankerz Meet//meet.mankerz.xyz//ES",
                        "BEGIN:VEVENT",
                        `SUMMARY:${eventTitle}`,
                        `DESCRIPTION:Turno agendado en meet.mankerz.xyz/${profile.slug}`,
                        `DTSTART:${startClean}`,
                        `DTEND:${endClean}`,
                        "STATUS:CONFIRMED",
                        "END:VEVENT",
                        "END:VCALENDAR",
                      ].join("\r\n");

                      const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.setAttribute("download", `turno-${bookingResult.booking.date}.ics`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${theme.secondaryBtn}`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>Guardar iCal</span>
                  </button>
                </div>

                {/* 1-Click Manage / Cancel button */}
                <div className="pt-1">
                  <Link
                    href={`/${profile.slug}/turno/${bookingResult.cancellationToken || bookingResult.booking.cancellationToken || bookingResult.managementCode || ""}`}
                    className="w-full py-2.5 px-3 rounded-xl border border-zinc-800 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                    <span>¿No podés asistir? Cancelar o Reprogramar Turno</span>
                  </Link>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setBookingResult(null);
                  setSelectedSlot(null);
                  setSelectedDateStr(null);
                }}
                className={`mt-5 text-xs transition ${theme.footerLink}`}
              >
                Agendar otro turno &rarr;
              </button>
            </div>
          ) : (
            <>
              {/* SERVICE / APPOINTMENT TYPE SELECTOR */}
              {activeServices.length > 0 && (
                <div className={`rounded-2xl p-4 border mb-3 ${theme.cardBg}`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className={`font-semibold text-xs ${theme.titleText}`}>
                      Elegí el tipo de turno
                    </span>
                    <span className={`text-[11px] font-mono ${theme.mutedText}`}>
                      {activeServices.length} {activeServices.length === 1 ? "opción" : "opciones"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {activeServices.map((srv) => {
                      const isChosen = selectedService?.id === srv.id;
                      return (
                        <button
                          key={srv.id}
                          type="button"
                          onClick={() => {
                            setSelectedServiceId(srv.id);
                            setSelectedSlot(null);
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                            isChosen ? theme.slotSelected : theme.slotOpen
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">{srv.name}</div>
                            {srv.description && (
                              <div className={`text-[11px] truncate mt-0.5 ${isChosen ? "opacity-75" : theme.mutedText}`}>
                                {srv.description}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                            <span>{srv.duration} min</span>
                            {srv.price !== null && (
                              <span className="font-semibold">
                                ${srv.price.toLocaleString("es-AR")}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STAFF / PROFESSIONAL SELECTOR (If profile has active staff members) */}
              {activeStaffMembers.length > 0 && (
                <div className={`rounded-2xl p-4 border mb-4 ${theme.cardBg}`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${theme.mutedText}`}>
                      ¿Con quién te gustaría atenderte?
                    </span>
                    <span className={`text-[11px] font-mono ${theme.mutedText}`}>
                      {activeStaffMembers.length} {activeStaffMembers.length === 1 ? "profesional" : "profesionales"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Option: Cualquiera disponible */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStaffMemberId("any");
                        setSelectedSlot(null);
                      }}
                      className={`text-left p-2.5 rounded-xl border transition cursor-pointer flex items-center gap-2.5 ${
                        selectedStaffMemberId === "any" ? theme.slotSelected : theme.slotOpen
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                          selectedStaffMemberId === "any"
                            ? "bg-zinc-950 text-white"
                            : "bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">Cualquiera disponible</div>
                        <div
                          className={`text-[10px] truncate ${
                            selectedStaffMemberId === "any" ? "opacity-75" : theme.mutedText
                          }`}
                        >
                          Asignación automática
                        </div>
                      </div>
                    </button>

                    {/* Option: Specific Staff Members */}
                    {activeStaffMembers.map((staff) => {
                      const isChosen = selectedStaffMemberId === staff.id;
                      return (
                        <button
                          key={staff.id}
                          type="button"
                          onClick={() => {
                            setSelectedStaffMemberId(staff.id);
                            setSelectedSlot(null);
                          }}
                          className={`text-left p-2.5 rounded-xl border transition cursor-pointer flex items-center gap-2.5 ${
                            isChosen ? theme.slotSelected : theme.slotOpen
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700/60 flex items-center justify-center overflow-hidden shrink-0 text-xs font-bold text-white">
                            {staff.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={staff.avatarUrl}
                                alt={staff.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              staff.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">{staff.name}</div>
                            {staff.role && (
                              <div
                                className={`text-[10px] truncate ${
                                  isChosen ? "opacity-75" : theme.mutedText
                                }`}
                              >
                                {staff.role}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FULL MONTH CALENDAR VIEW */}
              <div className={`rounded-2xl p-5 border ${theme.cardBg}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className={`font-semibold text-sm capitalize ${theme.titleText}`}>
                    {monthName}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className={`p-1 rounded-lg transition ${theme.navHover}`}
                      title="Mes anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className={`p-1 rounded-lg transition ${theme.navHover}`}
                      title="Mes siguiente"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className={`grid grid-cols-7 gap-1 text-center text-[10px] font-mono mb-2 ${theme.mutedText}`}>
                  {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d, i) => (
                    <div key={i} className="py-0.5">
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                  {[...Array(calendarDays.firstDayOffset)].map((_, i) => (
                    <div key={`offset-${i}`} className="h-10" />
                  ))}

                  {calendarDays.days.map((item) => {
                    const isSelected = selectedDateStr === item.dateStr;
                    const isDisabled = item.isPast || !item.isActiveDay;

                    return (
                      <button
                        key={item.dateStr}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setSelectedDateStr(item.dateStr)}
                        className={`h-10 rounded-xl text-xs font-medium transition relative flex flex-col items-center justify-center cursor-pointer ${
                          isDisabled
                            ? theme.dayDisabled
                            : isSelected
                            ? theme.daySelected
                            : theme.dayActive
                        }`}
                      >
                        <span>{item.dayNumber}</span>
                        {!isDisabled && !isSelected && (
                          <span className={`w-1 h-1 rounded-full mt-0.5 ${theme.dayDot}`} />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${theme.divider} ${theme.mutedText}`}>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${theme.dayDot}`} />
                    <span>Días disponibles</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${theme.dotOff}`} />
                    <span>Sin turnos</span>
                  </div>
                </div>
              </div>

              {/* AVAILABLE SLOTS DRAWER */}
              {selectedDateStr && (
                <div className={`mt-3 rounded-2xl p-4 border animate-slide-up ${theme.cardBg}`}>
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <div>
                      <span className={`text-[11px] ${theme.mutedText}`}>Horarios para el:</span>
                      <div className={`font-semibold capitalize ${theme.titleText}`}>
                        {formatDateSpanish(selectedDateStr)}
                      </div>
                    </div>
                    <span className={`font-mono text-[11px] px-2 py-0.5 rounded border ${theme.durationBadge}`}>
                      {effectiveDuration} min
                    </span>
                  </div>

                  {loadingSlots ? (
                    <div className={`py-6 flex items-center justify-center gap-2 text-xs font-mono ${theme.mutedText}`}>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Buscando turnos libres...</span>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className={`py-5 text-center text-xs rounded-xl font-light ${theme.mutedText} ${theme.summaryBg}`}>
                      No quedan turnos disponibles para esta fecha.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5">
                      {slots.map((slot) => {
                        const isChosen = selectedSlot?.startTime === slot.startTime;
                        return (
                          <button
                            key={slot.startTime}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2 px-1 rounded-xl text-xs font-mono transition border cursor-pointer ${
                              !slot.available
                                ? theme.slotDisabled
                                : isChosen
                                ? theme.slotSelected
                                : theme.slotOpen
                            }`}
                          >
                            {slot.startTime} hs
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* BOOKING CONFIRMATION FORM */}
              {selectedSlot && (
                <form
                  onSubmit={handleSubmitBooking}
                  className={`mt-3 rounded-2xl p-4 border animate-slide-up space-y-3 ${theme.cardActiveBorder}`}
                >
                  <div className={`flex items-center justify-between pb-2 border-b ${theme.divider}`}>
                    <div className="text-xs">
                      <span className={`block text-[11px] ${theme.mutedText}`}>
                        {selectedService ? selectedService.name : "Horario elegido:"}
                        {selectedStaff
                          ? ` • Con ${selectedStaff.name}`
                          : activeStaffMembers.length > 0
                          ? " • Con cualquiera disponible"
                          : ""}
                      </span>
                      <span className={`font-semibold ${theme.titleText}`}>
                        {selectedSlot.startTime} a {selectedSlot.endTime} hs
                      </span>
                    </div>
                    <span className={`text-[11px] font-mono ${theme.subText}`}>
                      {effectiveDuration} min
                    </span>
                  </div>

                  {bookingError && (
                    <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-900/50 text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  <div>
                    <label className={`block text-[11px] font-medium mb-1 ${theme.subText}`}>
                      Nombre y Apellido *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ej: Sofía Gómez"
                      required
                      className={`w-full px-3 py-2 rounded-xl text-xs ${theme.inputCls}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[11px] font-medium mb-1 ${theme.subText}`}>
                      Número de WhatsApp *
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Ej: +54 9 11 2233 4455"
                      required
                      className={`w-full px-3 py-2 rounded-xl text-xs font-mono ${theme.inputCls}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[11px] font-medium mb-1 ${theme.subText}`}>
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="sofia@ejemplo.com"
                      required
                      className={`w-full px-3 py-2 rounded-xl text-xs font-mono ${theme.inputCls}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[11px] font-medium mb-1 ${theme.subText}`}>
                      Nota o comentario (opcional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ej: Primera consulta / Detalle del servicio"
                      className={`w-full px-3 py-2 rounded-xl text-xs ${theme.inputCls}`}
                    />
                  </div>

                  {/* DEPOSIT NOTICE */}
                  {profile.depositRequired && (profile.bankAlias || profile.bankCbu) && (
                    <div className="p-3 rounded-xl border border-amber-900/40 bg-amber-950/20 text-left text-xs text-amber-200 flex items-start gap-2">
                      <CreditCard className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-relaxed">
                        <strong className="text-amber-300 font-semibold block mb-0.5">
                          Seña requerida para este turno
                        </strong>
                        {selectedService?.price && profile.depositPercentage ? (
                          <span>
                            Seña del <strong>{profile.depositPercentage}%</strong> equivalente a{" "}
                            <strong className="text-white font-mono font-semibold">
                              ${Math.round((selectedService.price * profile.depositPercentage) / 100).toLocaleString("es-AR")}
                            </strong>{" "}
                            (sobre el valor de ${selectedService.price.toLocaleString("es-AR")}).
                          </span>
                        ) : profile.depositPercentage ? (
                          <span>
                            Se solicitará una seña del <strong>{profile.depositPercentage}%</strong> por transferencia bancaria.
                          </span>
                        ) : profile.depositAmount ? (
                          <span>
                            Se solicitará una seña de{" "}
                            <strong className="text-white font-mono font-semibold">
                              ${profile.depositAmount.toLocaleString("es-AR")}
                            </strong>{" "}
                            por transferencia bancaria.
                          </span>
                        ) : (
                          <span>Se solicitará una seña por transferencia bancaria.</span>
                        )}
                        <span className="block mt-1 text-amber-300/80">
                          Al confirmar verás el Alias para transferir y enviar el comprobante.
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingBooking}
                    className={`w-full py-2.5 rounded-xl font-medium text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${theme.primaryBtn}`}
                  >
                    {submittingBooking ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Confirmando...</span>
                      </>
                    ) : (
                      <>
                        <CalendarCheck className="w-3.5 h-3.5" />
                        <span>Confirmar Turno ({selectedSlot.startTime} hs)</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* Footer Brand Tag */}
        <div className={`mt-8 text-center text-xs pb-4 font-light ${theme.footerText}`}>
          <a
            href="https://mankerz.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className={`transition inline-flex items-center gap-1 ${theme.footerLink}`}
          >
            <span>Powered by</span>
            <span className={`font-medium ${theme.footerBrand}`}>Mankerz</span>
          </a>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  MessageCircle,
  User,
  Scissors,
  AlertTriangle,
  RotateCcw,
  Search,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { formatDateSpanish } from "@/lib/utils";

interface TurnoBooking {
  id: string;
  managementCode: string | null;
  cancellationToken: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  formattedDate: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  depositAmount: number | null;
  notes: string | null;
  serviceName: string | null;
  serviceDuration: number;
  servicePrice: number | null;
  staffMemberName: string | null;
  staffMemberId: string | null;
}

interface TurnoProfile {
  name: string;
  slug: string;
  title: string;
  whatsapp: string;
  address?: string | null;
  addressUrl?: string | null;
  cancelNoticeHours: number;
}

interface TurnoPolicy {
  canManage: boolean;
  reason: string | null;
  hoursRemaining: number;
  cancelNoticeHours: number;
}

interface AvailableSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export default function TurnoClient({
  slug,
  initialTokenOrCode,
}: {
  slug: string;
  initialTokenOrCode?: string;
}) {
  const [tokenOrCode, setTokenOrCode] = useState(initialTokenOrCode || "");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(Boolean(initialTokenOrCode));
  const [error, setError] = useState<string | null>(null);

  const [booking, setBooking] = useState<TurnoBooking | null>(null);
  const [profile, setProfile] = useState<TurnoProfile | null>(null);
  const [policy, setPolicy] = useState<TurnoPolicy | null>(null);

  const [copiedCode, setCopiedCode] = useState(false);

  // Reschedule state
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedNewSlot, setSelectedNewSlot] = useState<AvailableSlot | null>(
    null
  );
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  // Cancellation confirm modal/state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(
    null
  );

  const [isPending, startTransition] = useTransition();

  const fetchBooking = async (lookupValue: string) => {
    if (!lookupValue.trim()) return;
    setLoading(true);
    setError(null);
    setActionSuccessMessage(null);
    setIsRescheduling(false);
    setShowCancelConfirm(false);

    try {
      const isToken = lookupValue.length > 15;
      const param = isToken
        ? `token=${encodeURIComponent(lookupValue.trim())}`
        : `code=${encodeURIComponent(lookupValue.trim().toUpperCase())}`;

      const res = await fetch(`/api/public/${slug}/manage?${param}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo encontrar el turno.");
      }

      setBooking(data.booking);
      setProfile(data.profile);
      setPolicy(data.policy);
    } catch (err: unknown) {
      setBooking(null);
      setError(
        err instanceof Error ? err.message : "Error al consultar el turno"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTokenOrCode) {
      fetchBooking(initialTokenOrCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, initialTokenOrCode]);

  // Load slots when newDate changes in reschedule mode
  useEffect(() => {
    if (!isRescheduling || !newDate || !booking) return;

    let isMounted = true;
    setLoadingSlots(true);
    setRescheduleError(null);
    setSelectedNewSlot(null);

    const params = new URLSearchParams({
      date: newDate,
    });
    if (booking.staffMemberId) {
      params.set("staffMemberId", booking.staffMemberId);
    }

    fetch(`/api/public/${slug}/slots?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.error) {
          setRescheduleError(data.error);
          setAvailableSlots([]);
        } else {
          // If on the same date as current booking, the current slot can be displayed or replaced
          setAvailableSlots(data.slots || []);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setRescheduleError(
            err instanceof Error ? err.message : "Error al cargar horarios"
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoadingSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isRescheduling, newDate, slug, booking]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleConfirmCancel = () => {
    if (!booking) return;

    startTransition(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/public/${slug}/manage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: booking.cancellationToken,
            code: booking.managementCode,
            action: "CANCEL",
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Error al cancelar el turno.");
        }

        setBooking((prev) => (prev ? { ...prev, status: "CANCELLED" } : null));
        setShowCancelConfirm(false);
        setActionSuccessMessage(
          "El turno ha sido cancelado exitosamente. El horario quedó liberado en el calendario."
        );
        // re-fetch policy to refresh status
        if (booking.cancellationToken || booking.managementCode) {
          fetchBooking(booking.cancellationToken || booking.managementCode || "");
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Error al cancelar el turno"
        );
      }
    });
  };

  const handleConfirmReschedule = () => {
    if (!booking || !newDate || !selectedNewSlot) return;

    startTransition(async () => {
      setRescheduleError(null);
      try {
        const res = await fetch(`/api/public/${slug}/manage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: booking.cancellationToken,
            code: booking.managementCode,
            action: "RESCHEDULE",
            newDate,
            newStartTime: selectedNewSlot.startTime,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Error al reprogramar el turno.");
        }

        setIsRescheduling(false);
        setActionSuccessMessage(
          `¡Turno reprogramado con éxito para el ${formatDateSpanish(
            newDate
          )} a las ${selectedNewSlot.startTime} hs! Te enviamos la confirmación por email.`
        );

        // refresh data
        if (booking.cancellationToken || booking.managementCode) {
          fetchBooking(booking.cancellationToken || booking.managementCode || "");
        }
      } catch (err: unknown) {
        setRescheduleError(
          err instanceof Error ? err.message : "Error al reprogramar"
        );
      }
    });
  };

  // WhatsApp link fallback
  const getWhatsAppHelpLink = () => {
    if (!profile?.whatsapp) return null;
    const phone = profile.whatsapp.replace(/[^\d]/g, "");
    if (phone.length < 8) return null;

    const text = encodeURIComponent(
      `Hola ${profile.name}! Necesito asistencia con mi turno ${
        booking?.managementCode ? `(${booking.managementCode})` : ""
      } agendado para el ${booking?.formattedDate || ""} a las ${
        booking?.startTime || ""
      } hs.`
    );
    return `https://wa.me/${phone}?text=${text}`;
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col justify-between selection:bg-zinc-800">
      <div className="w-full max-w-md mx-auto p-4 sm:p-6 space-y-4">
        {/* Top Navbar */}
        <div className="flex items-center justify-between py-2 border-b border-zinc-800/80">
          <Link
            href={`/${slug}`}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al perfil</span>
          </Link>
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
            Mankerz Meet
          </span>
        </div>

        {/* Search by Code Bar if no booking loaded or to change code */}
        {!booking && !loading && (
          <div className="rounded-2xl p-6 border border-zinc-800 bg-[#121215] text-center space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-300">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">
                Consultar o Gestionar Turno
              </h1>
              <p className="text-xs text-zinc-400 mt-1 font-light">
                Ingresá el código de 6 caracteres (ej: <strong>MK-4892</strong>) que
                recibiste al reservar tu turno.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchInput.trim()) {
                  setTokenOrCode(searchInput.trim());
                  fetchBooking(searchInput.trim());
                }
              }}
              className="space-y-3"
            >
              <input
                type="text"
                placeholder="Código ej: MK-XXXX"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center font-mono text-sm tracking-widest text-white uppercase placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                maxLength={10}
                required
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition"
              >
                Buscar Turno
              </button>
            </form>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="rounded-2xl p-12 border border-zinc-800 bg-[#121215] text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-400 mx-auto" />
            <p className="text-xs text-zinc-400">Cargando datos del turno...</p>
          </div>
        )}

        {/* Booking Card */}
        {booking && !loading && (
          <div className="space-y-4 animate-fade-in">
            {/* Success notification banner if action was performed */}
            {actionSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <div className="leading-relaxed">{actionSuccessMessage}</div>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Main Status & Details Card */}
            <div className="rounded-2xl p-5 border border-zinc-800 bg-[#121215] space-y-4">
              {/* Header with status badge */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
                    {profile?.name || "Local"}
                  </span>
                  <h2 className="text-sm font-semibold text-white">
                    Gestión de Turno
                  </h2>
                </div>

                <div>
                  {booking.status === "CONFIRMED" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-900/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Confirmado
                    </span>
                  )}
                  {booking.status === "CANCELLED" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-950/60 text-rose-400 border border-rose-900/50">
                      <XCircle className="w-3 h-3" />
                      Cancelado
                    </span>
                  )}
                  {booking.status === "COMPLETED" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                      <Check className="w-3 h-3" />
                      Completado
                    </span>
                  )}
                </div>
              </div>

              {/* Booking Code Highlight */}
              {booking.managementCode && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/70 border border-zinc-800">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                      Código de Turno
                    </span>
                    <span className="font-mono text-base font-bold text-white tracking-widest">
                      {booking.managementCode}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyCode(booking.managementCode!)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-[11px] font-medium transition flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedCode ? "Copiado" : "Copiar"}</span>
                  </button>
                </div>
              )}

              {/* Booking metadata */}
              <div className="space-y-2.5 text-xs">
                {booking.serviceName && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5" />
                      Servicio:
                    </span>
                    <span className="font-medium text-white text-right">
                      {booking.serviceName}
                      {booking.servicePrice && (
                        <span className="text-zinc-400 font-normal ml-1">
                          ($
                          {booking.servicePrice.toLocaleString("es-AR")})
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {booking.staffMemberName && (
                  <div className="flex justify-between items-center py-1 border-t border-zinc-800/60">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Profesional:
                    </span>
                    <span className="font-medium text-white">
                      {booking.staffMemberName}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-1 border-t border-zinc-800/60">
                  <span className="text-zinc-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Fecha:
                  </span>
                  <span className="font-medium text-white capitalize">
                    {booking.formattedDate}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-t border-zinc-800/60">
                  <span className="text-zinc-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Horario:
                  </span>
                  <span className="font-mono font-semibold text-white">
                    {booking.startTime} a {booking.endTime} hs
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-t border-zinc-800/60">
                  <span className="text-zinc-500">Cliente:</span>
                  <span className="font-medium text-white">
                    {booking.customerName}
                  </span>
                </div>

                {profile?.address && (
                  <div className="flex justify-between items-center py-1 border-t border-zinc-800/60">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      Ubicación:
                    </span>
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
                      className="font-medium text-emerald-400 hover:underline flex items-center gap-1 max-w-[200px]"
                    >
                      <span className="truncate">{profile.address}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                )}
              </div>

              {/* Status explanation notice if cancelled */}
              {booking.status === "CANCELLED" && (
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 text-center space-y-2">
                  <p>
                    Este turno fue cancelado y el lugar ya está disponible en el
                    calendario.
                  </p>
                  <Link
                    href={`/${slug}`}
                    className="inline-block px-4 py-2 rounded-xl bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition"
                  >
                    Reservar un nuevo turno
                  </Link>
                </div>
              )}

              {/* ACTIVE ACTIONS SECTION (Only if status is CONFIRMED) */}
              {booking.status === "CONFIRMED" && (
                <div className="pt-3 border-t border-zinc-800 space-y-3">
                  {/* Policy banner */}
                  {policy && !policy.canManage ? (
                    <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-900/50 text-xs text-amber-200 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-amber-300 font-semibold mb-0.5">
                            Modificación restringida
                          </strong>
                          <p className="text-[11px] text-amber-200/90 leading-relaxed">
                            {policy.reason}
                          </p>
                        </div>
                      </div>

                      {getWhatsAppHelpLink() && (
                        <a
                          href={getWhatsAppHelpLink()!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 w-full py-2 px-3 rounded-lg bg-amber-400 text-zinc-950 font-medium text-xs flex items-center justify-center gap-1.5 hover:bg-amber-300 transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Escribir por WhatsApp al local</span>
                        </a>
                      )}
                    </div>
                  ) : (
                    /* Policy allows self-management */
                    <div className="space-y-2">
                      <div className="text-[11px] text-zinc-500 flex items-center justify-between pb-1">
                        <span>Autogestión de turno:</span>
                        {policy?.cancelNoticeHours ? (
                          <span>Hasta {policy.cancelNoticeHours} hs antes</span>
                        ) : (
                          <span>100% libre</span>
                        )}
                      </div>

                      {!isRescheduling && !showCancelConfirm && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsRescheduling(true);
                              // set default newDate to today or tomorrow
                              const now = new Date();
                              setNewDate(now.toISOString().split("T")[0]);
                            }}
                            className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-medium text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-zinc-300" />
                            <span>Reprogramar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowCancelConfirm(true)}
                            className="py-2.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 border border-rose-900/60 text-rose-300 font-medium text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>Cancelar Turno</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CANCEL CONFIRMATION DIALOG */}
                  {showCancelConfirm && (
                    <div className="p-4 rounded-xl border border-rose-900/80 bg-rose-950/20 space-y-3 animate-slide-up">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-semibold text-rose-300">
                            ¿Estás seguro de cancelar este turno?
                          </h4>
                          <p className="text-[11px] text-rose-200/80 mt-1 leading-relaxed">
                            El horario ({booking.formattedDate} a las{" "}
                            {booking.startTime} hs) se liberará inmediatamente
                            para que otros clientes puedan reservarlo.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={handleConfirmCancel}
                          className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                        >
                          {isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Confirmar Cancelación</span>
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => setShowCancelConfirm(false)}
                          className="py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition cursor-pointer"
                        >
                          Volver
                        </button>
                      </div>
                    </div>
                  )}

                  {/* RESCHEDULE INTERACTIVE PANEL */}
                  {isRescheduling && (
                    <div className="p-4 rounded-xl border border-zinc-700 bg-zinc-900/80 space-y-3 animate-slide-up">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                        <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Elegir nueva fecha y hora</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsRescheduling(false);
                            setSelectedNewSlot(null);
                          }}
                          className="text-[11px] text-zinc-400 hover:text-white transition"
                        >
                          Cerrar
                        </button>
                      </div>

                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Seleccioná la fecha:
                        </label>
                        <input
                          type="date"
                          value={newDate}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) => setNewDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono"
                        />
                      </div>

                      {/* Live slots picker */}
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1.5">
                          Horarios disponibles:
                        </label>

                        {loadingSlots ? (
                          <div className="py-6 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Buscando huecos libres...</span>
                          </div>
                        ) : rescheduleError ? (
                          <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-300 text-[11px]">
                            {rescheduleError}
                          </div>
                        ) : availableSlots.filter((s) => s.available).length ===
                          0 ? (
                          <div className="py-4 text-center text-xs text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800">
                            No hay turnos disponibles para esta fecha.
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1">
                            {availableSlots
                              .filter((s) => s.available)
                              .map((slot) => {
                                const isSelected =
                                  selectedNewSlot?.startTime === slot.startTime;
                                return (
                                  <button
                                    key={slot.startTime}
                                    type="button"
                                    onClick={() => setSelectedNewSlot(slot)}
                                    className={`py-2 px-1 rounded-lg text-xs font-mono transition border cursor-pointer ${
                                      isSelected
                                        ? "bg-white text-zinc-950 font-bold border-white"
                                        : "bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-300"
                                    }`}
                                  >
                                    {slot.startTime} hs
                                  </button>
                                );
                              })}
                          </div>
                        )}
                      </div>

                      {/* Selected slot recap and confirmation button */}
                      {selectedNewSlot && (
                        <div className="pt-2 border-t border-zinc-800 space-y-2">
                          <div className="text-[11px] text-zinc-300 flex justify-between bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                            <span className="text-zinc-500">Nuevo horario:</span>
                            <span className="font-semibold text-white">
                              {formatDateSpanish(newDate)} •{" "}
                              {selectedNewSlot.startTime} hs
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={handleConfirmReschedule}
                            className="w-full py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-semibold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            {isPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Confirmar Reprogramación</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Check another code option */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setBooking(null);
                  setSearchInput("");
                }}
                className="text-xs text-zinc-500 hover:text-zinc-300 underline transition"
              >
                Consultar otro turno con código
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-zinc-600 border-t border-zinc-900">
        <a
          href="https://mankerz.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-zinc-400 transition"
        >
          Powered by Mankerz
        </a>
      </footer>
    </div>
  );
}

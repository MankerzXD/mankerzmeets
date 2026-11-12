"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  User,
  Copy,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  Phone,
  Shield,
  Trash2,
  Check,
  QrCode,
  Printer,
  Download,
  Upload,
  X,
} from "lucide-react";
import { formatDayName, formatDateSpanish } from "@/lib/utils";

interface DaySchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  breakStartTime: string | null;
  breakEndTime: string | null;
}

interface ProfileData {
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
  timezone: string;
  status: string;
  slotDuration: number;
  availabilities: DaySchedule[];
}

interface BookingItem {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  notes: string | null;
  status: string;
}

const TIMEZONE_OPTIONS = [
  { value: "America/Argentina/Buenos_Aires", label: "Argentina (Buenos Aires, GMT-3)" },
  { value: "America/Montevideo", label: "Uruguay (Montevideo, GMT-3)" },
  { value: "America/Santiago", label: "Chile (Santiago)" },
  { value: "America/Mexico_City", label: "México (CDMX)" },
  { value: "America/Bogota", label: "Colombia (Bogotá)" },
  { value: "America/Lima", label: "Perú (Lima)" },
  { value: "Europe/Madrid", label: "España (Madrid)" },
  { value: "America/New_York", label: "EE.UU. (Este / New York)" },
];

export default function TenantDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; role: string } | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [activeTab, setActiveTab] = useState<"BOOKINGS" | "AVAILABILITY" | "DESIGN" | "CONTACT" | "QR">("BOOKINGS");

  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form states for profile
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [slug, setSlug] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [template, setTemplate] = useState("MINIMAL_DARK");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [timezone, setTimezone] = useState("America/Argentina/Buenos_Aires");
  const [slotDuration, setSlotDuration] = useState(30);

  // Form state for 7-day schedule
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const authRes = await fetch("/api/auth/me");
        if (!authRes.ok) {
          router.push("/login");
          return;
        }

        const authData = await authRes.json();
        setCurrentUser(authData.user);

        if (authData.user.profile) {
          const p = authData.user.profile;
          setProfile(p);
          setName(p.name || "");
          setTitle(p.title || "");
          setBio(p.bio || "");
          setSlug(p.slug || "");
          setAvatarUrl(p.avatarUrl || "");
          setBannerUrl(p.bannerUrl || "");
          setTemplate(p.template || "MINIMAL_DARK");
          setWhatsapp(p.whatsapp || "");
          setInstagram(p.instagram || "");
          setTimezone(p.timezone || "America/Argentina/Buenos_Aires");
          setSlotDuration(p.slotDuration || 30);

          const fullWeek: DaySchedule[] = [];
          for (let day = 0; day <= 6; day++) {
            const existing = (p.availabilities || []).find((a: DaySchedule) => a.dayOfWeek === day);
            if (existing) {
              fullWeek.push(existing);
            } else {
              fullWeek.push({
                dayOfWeek: day,
                startTime: "09:00",
                endTime: "18:00",
                isActive: day >= 1 && day <= 5,
                breakStartTime: "13:00",
                breakEndTime: "14:00",
              });
            }
          }
          setSchedule(fullWeek);
        }

        const bookingsRes = await fetch("/api/dashboard/bookings");
        if (bookingsRes.ok) {
          const bData = await bookingsRes.json();
          setBookings(bData.bookings || []);
        }
      } catch (err) {
        console.error("Dashboard loading error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const showNotification = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCopyLink = () => {
    if (!profile) return;
    const url = `${window.location.origin}/${profile.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showNotification("success", "Enlace de perfil copiado");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleImageUpload = async (
    file: File,
    kind: "avatar" | "banner"
  ) => {
    const setLoadingState =
      kind === "avatar" ? setUploadingAvatar : setUploadingBanner;
    setLoadingState(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", kind);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al subir imagen");
      }

      if (kind === "avatar") {
        setAvatarUrl(data.url);
      } else {
        setBannerUrl(data.url);
      }

      // Immediately persist image URL in profile
      const saveRes = await fetch("/api/dashboard/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(kind === "avatar"
            ? { avatarUrl: data.url }
            : { bannerUrl: data.url }),
        }),
      });
      if (saveRes.ok) {
        const saved = await saveRes.json();
        setProfile((prev) => (prev ? { ...prev, ...saved.profile } : saved.profile));
      }

      showNotification("success", "Imagen subida y guardada");
    } catch (err: unknown) {
      showNotification(
        "error",
        err instanceof Error ? err.message : "No se pudo subir la imagen"
      );
    } finally {
      setLoadingState(false);
    }
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          title,
          bio,
          avatarUrl: avatarUrl || null,
          bannerUrl: bannerUrl || null,
          template,
          whatsapp,
          instagram,
          timezone,
          slotDuration,
          slug,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar perfil");

      setProfile((prev) => (prev ? { ...prev, ...data.profile } : data.profile));
      showNotification("success", "Cambios guardados con éxito.");
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAvailability = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar disponibilidad");

      showNotification("success", "Horarios guardados.");
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/dashboard/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: newStatus }),
      });

      if (!res.ok) throw new Error("Error al actualizar turno");

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      showNotification("success", `Turno actualizado a "${newStatus}"`);
    } catch {
      showNotification("error", "No se pudo actualizar el turno");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-300 mb-2" />
        <span className="text-xs font-mono">Cargando panel...</span>
      </div>
    );
  }

  const originUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "https://meet.mankerz.xyz";
  const publicProfileUrl = profile ? `${originUrl}/${profile.slug}` : "";

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      {/* Top Bar */}
      <header className="print:hidden border-b border-zinc-800/80 bg-[#0c0c0e]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white text-zinc-950 font-bold text-xs flex items-center justify-center">
                M
              </div>
              <span className="font-semibold text-white text-sm">
                Mankerz Meet
              </span>
            </Link>

            {currentUser?.role === "SUPERADMIN" && (
              <Link
                href="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-mono hover:bg-zinc-700 transition"
              >
                <Shield className="w-3 h-3" />
                <span>SuperAdmin</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {profile && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-mono">
                <span className="text-zinc-500">/{profile.slug}</span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  title="Copiar enlace"
                  className="hover:text-white transition"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <Link
                  href={`/${profile.slug}`}
                  target="_blank"
                  title="Ver perfil público"
                  className="hover:text-white transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {notification && (
          <div
            className={`print:hidden fixed bottom-5 right-5 z-50 p-3.5 rounded-xl shadow-lg border text-xs flex items-center gap-2 ${
              notification.type === "success"
                ? "bg-zinc-900 border-zinc-700 text-white"
                : "bg-rose-950/80 border-rose-800 text-rose-200"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
        )}

        {/* Onboarding alert if WhatsApp is not set */}
        {profile && !profile.whatsapp && (
          <div className="print:hidden mb-4 p-4 rounded-2xl border border-amber-800/50 bg-amber-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Todavía no configuraste tu número de WhatsApp para recibir los avisos de tus clientes.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("CONTACT")}
              className="px-3.5 py-1.5 rounded-full bg-white text-zinc-950 text-xs font-medium hover:bg-zinc-200 transition shrink-0"
            >
              Configurar WhatsApp
            </button>
          </div>
        )}

        {/* Profile Header Summary */}
        <div className="print:hidden rounded-2xl p-5 sm:p-6 mb-6 border border-zinc-800 bg-[#121215] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
              {profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-zinc-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white">
                  {profile?.name || "Mi Perfil"}
                </h1>
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                    profile?.status === "ACTIVE"
                      ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900"
                      : "bg-rose-950/60 text-rose-400 border border-rose-900"
                  }`}
                >
                  {profile?.status === "ACTIVE" ? "Activo" : "Suspendido"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 font-light">
                {profile?.title || "Configura tu título profesional"}
              </p>
            </div>
          </div>

          {profile && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                href={`/${profile.slug}`}
                target="_blank"
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white text-zinc-950 font-medium text-xs hover:bg-zinc-200 transition flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ver perfil público</span>
              </Link>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-xs transition"
              >
                {copiedLink ? "¡Copiado!" : "Copiar link"}
              </button>
            </div>
          )}
        </div>

        {/* Minimal Tab Navigation */}
        <div className="print:hidden flex items-center gap-2 border-b border-zinc-800 pb-3 mb-6 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab("BOOKINGS")}
            className={`px-3.5 py-1.5 rounded-full font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === "BOOKINGS"
                ? "bg-white text-zinc-950 font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Turnos ({bookings.length})
          </button>

          <button
            onClick={() => setActiveTab("AVAILABILITY")}
            className={`px-3.5 py-1.5 rounded-full font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === "AVAILABILITY"
                ? "bg-white text-zinc-950 font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Disponibilidad
          </button>

          <button
            onClick={() => setActiveTab("DESIGN")}
            className={`px-3.5 py-1.5 rounded-full font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === "DESIGN"
                ? "bg-white text-zinc-950 font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Personalización Visual
          </button>

          <button
            onClick={() => setActiveTab("CONTACT")}
            className={`px-3.5 py-1.5 rounded-full font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === "CONTACT"
                ? "bg-white text-zinc-950 font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Redes y Contacto
          </button>

          <button
            onClick={() => setActiveTab("QR")}
            className={`px-3.5 py-1.5 rounded-full font-medium transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "QR"
                ? "bg-white text-zinc-950 font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Código QR & Mostrador</span>
          </button>
        </div>

        {/* TAB 1: BOOKINGS LIST */}
        {activeTab === "BOOKINGS" && (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="rounded-2xl p-12 text-center border border-zinc-800 bg-[#121215]">
                <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-2.5" />
                <h3 className="text-sm font-semibold text-zinc-300">Aún no hay turnos agendados</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto font-light">
                  Compartí tu enlace público para empezar a recibir reservas automáticas.
                </p>
                {profile && (
                  <button
                    onClick={handleCopyLink}
                    className="mt-4 px-4 py-2 rounded-full bg-white text-zinc-950 text-xs font-medium hover:bg-zinc-200 transition"
                  >
                    Copiar mi link
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className={`rounded-2xl p-4 border bg-[#121215] flex flex-col justify-between transition ${
                      b.status === "CONFIRMED"
                        ? "border-zinc-700"
                        : "border-zinc-800 opacity-60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-medium text-white bg-zinc-800 px-2.5 py-0.5 rounded-md">
                          {b.startTime} - {b.endTime} hs
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                            b.status === "CONFIRMED"
                              ? "bg-zinc-800 text-zinc-200"
                              : b.status === "COMPLETED"
                              ? "bg-emerald-950 text-emerald-300"
                              : "bg-rose-950 text-rose-300"
                          }`}
                        >
                          {b.status === "CONFIRMED"
                            ? "Confirmado"
                            : b.status === "COMPLETED"
                            ? "Atendido"
                            : "Cancelado"}
                        </span>
                      </div>

                      <div className="text-sm font-semibold text-white">{b.customerName}</div>
                      <div className="text-xs text-zinc-400 font-mono mt-0.5">
                        {formatDateSpanish(b.date)}
                      </div>

                      <div className="mt-3 space-y-1 text-xs text-zinc-400 font-light">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Phone className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{b.customerPhone}</span>
                        </div>
                        {b.notes && (
                          <div className="mt-2 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-300">
                            &ldquo;{b.notes}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
                      <a
                        href={`https://wa.me/${b.customerPhone.replace(/[^\d]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-zinc-300 hover:text-white font-medium flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Abrir WhatsApp</span>
                      </a>

                      {b.status === "CONFIRMED" && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleUpdateBookingStatus(b.id, "COMPLETED")}
                            title="Marcar completado"
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleUpdateBookingStatus(b.id, "CANCELLED")}
                            title="Cancelar turno"
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AVAILABILITY CONFIG */}
        {activeTab === "AVAILABILITY" && (
          <div className="space-y-4">
            <div className="rounded-2xl p-5 border border-zinc-800 bg-[#121215]">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-sm font-semibold text-white">Disponibilidad Semanal</h2>
                  <p className="text-xs text-zinc-400 mt-0.5 font-light">
                    Elegí qué días atendés, tu zona horaria y el receso de almuerzo.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Zona horaria:</span>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl minimal-input text-xs text-white"
                    >
                      {TIMEZONE_OPTIONS.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Duración:</span>
                    <select
                      value={slotDuration}
                      onChange={(e) => setSlotDuration(Number(e.target.value))}
                      className="px-2.5 py-1.5 rounded-xl minimal-input text-xs text-white"
                    >
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>60 min</option>
                    </select>
                  </div>

                  <button
                    onClick={async () => {
                      await handleSaveProfile();
                      await handleSaveAvailability();
                    }}
                    disabled={saving}
                    className="px-4 py-2 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Guardar Horarios</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {schedule.map((dayItem, index) => {
                  const dayName = formatDayName(dayItem.dayOfWeek);
                  return (
                    <div
                      key={dayItem.dayOfWeek}
                      className={`p-3.5 rounded-xl border transition flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                        dayItem.isActive
                          ? "bg-zinc-900/40 border-zinc-800"
                          : "bg-zinc-950 border-zinc-900 opacity-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 w-36">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={dayItem.isActive}
                            onChange={(e) => {
                              const newSched = [...schedule];
                              newSched[index].isActive = e.target.checked;
                              setSchedule(newSched);
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white"></div>
                        </label>
                        <span className={`text-xs font-medium ${dayItem.isActive ? "text-white" : "text-zinc-500"}`}>
                          {dayName}
                        </span>
                      </div>

                      {dayItem.isActive ? (
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-zinc-500">De:</span>
                            <input
                              type="time"
                              value={dayItem.startTime}
                              onChange={(e) => {
                                const newSched = [...schedule];
                                newSched[index].startTime = e.target.value;
                                setSchedule(newSched);
                              }}
                              className="px-2 py-1 rounded-lg minimal-input font-mono text-white text-xs"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-zinc-500">A:</span>
                            <input
                              type="time"
                              value={dayItem.endTime}
                              onChange={(e) => {
                                const newSched = [...schedule];
                                newSched[index].endTime = e.target.value;
                                setSchedule(newSched);
                              }}
                              className="px-2 py-1 rounded-lg minimal-input font-mono text-white text-xs"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-800 text-zinc-400">
                            <span className="text-zinc-500">Almuerzo:</span>
                            <input
                              type="time"
                              value={dayItem.breakStartTime || ""}
                              onChange={(e) => {
                                const newSched = [...schedule];
                                newSched[index].breakStartTime = e.target.value || null;
                                setSchedule(newSched);
                              }}
                              className="px-2 py-1 rounded-lg minimal-input font-mono text-white text-xs w-20"
                            />
                            <span>a</span>
                            <input
                              type="time"
                              value={dayItem.breakEndTime || ""}
                              onChange={(e) => {
                                const newSched = [...schedule];
                                newSched[index].breakEndTime = e.target.value || null;
                                setSchedule(newSched);
                              }}
                              className="px-2 py-1 rounded-lg minimal-input font-mono text-white text-xs w-20"
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-600">Cerrado</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VISUAL CUSTOMIZATION */}
        {activeTab === "DESIGN" && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="rounded-2xl p-5 border border-zinc-800 bg-[#121215]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-sm font-semibold text-white">Personalización Visual</h2>
                  <p className="text-xs text-zinc-400 mt-0.5 font-light">
                    Subí tus fotos y elegí el estilo de tu perfil público.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Guardar</span>
                </button>
              </div>

              {/* Template selection */}
              <div className="mb-6">
                <span className="block text-xs font-medium text-zinc-300 mb-2.5">
                  Estilo de Perfil:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setTemplate("MINIMAL_DARK")}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      template === "MINIMAL_DARK"
                        ? "border-white bg-zinc-900/80"
                        : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-semibold text-white">Minimal Dark</h4>
                      {template === "MINIMAL_DARK" && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <p className="text-xs text-zinc-400 font-light">
                      Fondo oscuro profundo, botones en blanco mate y contraste sutil.
                    </p>
                  </div>

                  <div
                    onClick={() => setTemplate("CLEAN_EDITORIAL")}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      template === "CLEAN_EDITORIAL"
                        ? "border-white bg-zinc-900/80"
                        : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-semibold text-white">Clean Editorial (Claro)</h4>
                      {template === "CLEAN_EDITORIAL" && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <p className="text-xs text-zinc-400 font-light">
                      Fondo claro tono papel marfil y estética editorial para consultorios y profesionales.
                    </p>
                  </div>
                </div>
              </div>

              {/* Image Uploads (Supabase Storage) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Avatar Upload */}
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                  <span className="block text-xs font-medium text-zinc-300 mb-2">
                    Foto de Perfil (opcional)
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-zinc-500" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3 py-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-medium cursor-pointer transition inline-flex items-center gap-1.5">
                        {uploadingAvatar ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{uploadingAvatar ? "Subiendo..." : "Subir foto"}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          disabled={uploadingAvatar}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleImageUpload(f, "avatar");
                          }}
                        />
                      </label>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl("")}
                          className="p-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-xs"
                          title="Quitar foto"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Banner Upload */}
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                  <span className="block text-xs font-medium text-zinc-300 mb-2">
                    Foto de Fondo / Banner (opcional)
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-14 rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
                      {bannerUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-zinc-500">Por defecto</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3 py-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-medium cursor-pointer transition inline-flex items-center gap-1.5">
                        {uploadingBanner ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{uploadingBanner ? "Subiendo..." : "Subir banner"}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          disabled={uploadingBanner}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleImageUpload(f, "banner");
                          }}
                        />
                      </label>
                      {bannerUrl && (
                        <button
                          type="button"
                          onClick={() => setBannerUrl("")}
                          className="p-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-xs"
                          title="Quitar banner"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-300 mb-1">Nombre Comercial</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl minimal-input text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-300 mb-1">Especialidad / Título</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl minimal-input text-xs text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs text-zinc-300 mb-1">Biografía Corta</label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl minimal-input text-xs text-white resize-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs text-zinc-300 mb-1">Slug de Enlace</label>
                  <div className="flex items-center rounded-xl minimal-input overflow-hidden px-3">
                    <span className="text-xs text-zinc-500 font-mono">meet.mankerz.xyz/</span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      required
                      className="w-full py-2 px-1 bg-transparent text-xs text-white outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* TAB 4: CONTACT & SOCIALS */}
        {activeTab === "CONTACT" && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="rounded-2xl p-5 border border-zinc-800 bg-[#121215]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-sm font-semibold text-white">Canales de Contacto</h2>
                  <p className="text-xs text-zinc-400 mt-0.5 font-light">
                    Configurá tu WhatsApp e Instagram para contacto directo.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Guardar</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                  <span className="block text-xs font-semibold text-white mb-1">WhatsApp</span>
                  <label className="block text-[11px] text-zinc-400 mb-2">
                    Código de país + número (sin símbolos ni espacios, ej: 54911...)
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="Ej: 5491122334455"
                    className="w-full px-3 py-2 rounded-xl minimal-input text-xs text-white font-mono"
                  />
                  {whatsapp && (
                    <a
                      href={`https://wa.me/${whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2.5 inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Probar link: wa.me/{whatsapp}</span>
                    </a>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                  <span className="block text-xs font-semibold text-white mb-1">Instagram</span>
                  <label className="block text-[11px] text-zinc-400 mb-2">
                    Tu usuario sin el &ldquo;@&rdquo;
                  </label>
                  <div className="flex items-center rounded-xl minimal-input overflow-hidden px-3">
                    <span className="text-xs text-zinc-500 font-mono">@</span>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value.replace(/[@\s]/g, ""))}
                      placeholder="usuario"
                      className="w-full py-2 px-1 bg-transparent text-xs text-white outline-none font-mono"
                    />
                  </div>
                  {instagram && (
                    <a
                      href={`https://instagram.com/${instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2.5 inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Ver instagram.com/{instagram}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </form>
        )}

        {/* TAB 5: QR CODE & COUNTER STAND */}
        {activeTab === "QR" && profile && (
          <div className="space-y-4">
            <div className="rounded-2xl p-6 border border-zinc-800 bg-[#121215] max-w-xl mx-auto text-center print:border-0 print:bg-white print:p-0">
              <div className="mb-4 print:hidden">
                <h2 className="text-sm font-semibold text-white">Cartel de Mostrador & Código QR</h2>
                <p className="text-xs text-zinc-400 mt-0.5 font-light">
                  Colocalo en tu mostrador o espejos para que tus clientes agenden su próximo turno antes de irse.
                </p>
              </div>

              {/* Printable Stand Preview */}
              <div className="my-6 p-6 rounded-2xl bg-white text-zinc-950 max-w-xs mx-auto shadow-2xl border border-zinc-200 print:shadow-none print:my-0">
                <div className="text-center mb-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white font-bold text-xs flex items-center justify-center mx-auto mb-2">
                    M
                  </div>
                  <h3 className="font-bold text-sm tracking-tight">{profile.name}</h3>
                  <p className="text-[11px] text-zinc-600">{profile.title}</p>
                </div>

                <div className="p-2 bg-white rounded-xl border border-zinc-200 inline-block mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(publicProfileUrl)}`}
                    alt="QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                </div>

                <div className="text-[11px] text-zinc-800 font-medium">
                  Escaneá con la cámara de tu celular
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  meet.mankerz.xyz/{profile.slug}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="print:hidden flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=10&data=${encodeURIComponent(publicProfileUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-medium transition flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar QR (PNG)</span>
                </a>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Cartel</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

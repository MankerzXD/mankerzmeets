"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  User,
  Users,
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
  Plus,
  Pencil,
  Clock,
  CreditCard,
  Info,
  Percent,
  TrendingUp,
  DollarSign,
  Wallet,
  CalendarDays,
  RotateCcw,
  Bell,
  Send,
  MapPin,
  Zap,
} from "lucide-react";
import { formatDayName, formatDateSpanish } from "@/lib/utils";
import { compressImageFile } from "@/lib/image-compress";

interface DaySchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  breakStartTime: string | null;
  breakEndTime: string | null;
}

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number | null;
  isActive: boolean;
}

interface StaffMemberItem {
  id: string;
  name: string;
  role: string | null;
  avatarUrl: string | null;
  email: string | null;
  phone: string | null;
  commissionPercentage: number;
  isActive: boolean;
  sortOrder: number;
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
  address?: string | null;
  addressUrl?: string | null;
  timezone: string;
  status: string;
  slotDuration: number;
  depositRequired: boolean;
  depositPercentage: number | null;
  depositAmount: number | null;
  bankAlias: string | null;
  bankCbu: string | null;
  bankHolder: string | null;
  depositNotes: string | null;
  cancelNoticeHours?: number | null;
  enableReminders?: boolean;
  reminderTiming?: string;
  availabilities: DaySchedule[];
  services?: ServiceItem[];
  staffMembers?: StaffMemberItem[];
}

interface BookingItem {
  id: string;
  serviceId?: string | null;
  serviceName: string | null;
  servicePrice?: number | null;
  staffMemberName?: string | null;
  staffMemberId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  notes: string | null;
  status: string;
  paymentStatus: string;
  depositAmount: number | null;
  managementCode?: string | null;
  cancellationToken?: string | null;
  reminder24hSent?: boolean;
  reminder2hSent?: boolean;
  staffMember?: {
    id: string;
    name: string;
    role: string | null;
    avatarUrl: string | null;
    commissionPercentage: number;
  } | null;
  service?: {
    id: string;
    name: string;
    duration: number;
    price: number | null;
  } | null;
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
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMemberItem[]>([]);
  const [activeTab, setActiveTab] = useState<"BOOKINGS" | "CONTROL" | "SERVICES" | "STAFF" | "AVAILABILITY" | "DEPOSIT" | "DESIGN" | "CONTACT" | "QR">("BOOKINGS");

  // Bank transfer / deposit settings
  const [depositRequired, setDepositRequired] = useState(false);
  const [depositPercentage, setDepositPercentage] = useState("50");
  const [depositAmount, setDepositAmount] = useState("");
  const [bankAlias, setBankAlias] = useState("");
  const [bankCbu, setBankCbu] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [depositNotes, setDepositNotes] = useState("");
  const [savingDeposit, setSavingDeposit] = useState(false);

  // Control & Comisiones states
  const [controlPeriod, setControlPeriod] = useState<"today" | "week" | "month" | "all">("month");
  const [controlStaffFilter, setControlStaffFilter] = useState<string>("all");
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualCustomerName, setManualCustomerName] = useState("Cliente en local");
  const [manualCustomerPhone, setManualCustomerPhone] = useState("");
  const [manualDate, setManualDate] = useState("");
  const [manualStartTime, setManualStartTime] = useState("10:00");
  const [manualServiceId, setManualServiceId] = useState("");
  const [manualStaffMemberId, setManualStaffMemberId] = useState("");
  const [manualServicePrice, setManualServicePrice] = useState("");
  const [manualStatus, setManualStatus] = useState("COMPLETED");
  const [manualNotes, setManualNotes] = useState("");
  const [savingManualBooking, setSavingManualBooking] = useState(false);
  const [editingPriceBookingId, setEditingPriceBookingId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState("");
  const [todayStr, setTodayStr] = useState("");
  const [mondayStr, setMondayStr] = useState("");
  const [currentYearMonth, setCurrentYearMonth] = useState("");

  // Service form states
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [serviceDuration, setServiceDuration] = useState(30);
  const [servicePrice, setServicePrice] = useState("");
  const [savingService, setSavingService] = useState(false);

  // Staff form states (Creación superior)
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffCommissionPercentage, setStaffCommissionPercentage] = useState("");
  const [staffAvatarUrl, setStaffAvatarUrl] = useState("");
  const [savingStaff, setSavingStaff] = useState(false);
  const [uploadingStaffPhoto, setUploadingStaffPhoto] = useState(false);

  // Staff inline edit states (Edición desplegable debajo de cada tarjeta)
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editStaffName, setEditStaffName] = useState("");
  const [editStaffRole, setEditStaffRole] = useState("");
  const [editStaffEmail, setEditStaffEmail] = useState("");
  const [editStaffPhone, setEditStaffPhone] = useState("");
  const [editStaffCommissionPercentage, setEditStaffCommissionPercentage] = useState("");
  const [editStaffAvatarUrl, setEditStaffAvatarUrl] = useState("");
  const [savingEditStaff, setSavingEditStaff] = useState(false);
  const [uploadingEditStaffPhoto, setUploadingEditStaffPhoto] = useState(false);

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
  const [address, setAddress] = useState("");
  const [addressUrl, setAddressUrl] = useState("");
  const [timezone, setTimezone] = useState("America/Argentina/Buenos_Aires");
  const [slotDuration, setSlotDuration] = useState(30);
  const [cancelNoticeHours, setCancelNoticeHours] = useState(0);
  const [enableReminders, setEnableReminders] = useState(true);
  const [reminderTiming, setReminderTiming] = useState("BOTH");
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);

  // Form state for 7-day schedule
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const now = new Date();
        const today = now.toISOString().split("T")[0];
        setTodayStr(today);
        setManualDate(today);
        setCurrentYearMonth(today.substring(0, 7));

        const dayOfWeek = (now.getDay() + 6) % 7;
        const mon = new Date(now);
        mon.setDate(now.getDate() - dayOfWeek);
        setMondayStr(mon.toISOString().split("T")[0]);

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
          setAddress(p.address || "");
          setAddressUrl(p.addressUrl || "");
          setTimezone(p.timezone || "America/Argentina/Buenos_Aires");
          setSlotDuration(p.slotDuration || 30);
          setServices(p.services || []);
          setStaffMembers(p.staffMembers || []);
          setDepositRequired(Boolean(p.depositRequired));
          setDepositPercentage(
            p.depositPercentage !== null && p.depositPercentage !== undefined
              ? String(p.depositPercentage)
              : "50"
          );
          setDepositAmount(p.depositAmount !== null && p.depositAmount !== undefined ? String(p.depositAmount) : "");
          setBankAlias(p.bankAlias || "");
          setBankCbu(p.bankCbu || "");
          setBankHolder(p.bankHolder || "");
          setDepositNotes(p.depositNotes || "");
          setCancelNoticeHours(p.cancelNoticeHours ?? 0);
          setEnableReminders(p.enableReminders ?? true);
          setReminderTiming(p.reminderTiming || "BOTH");

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
      // Compress client-side before sending to save bandwidth and prevent 413 errors
      const compressedFile = await compressImageFile(file, {
        maxWidth: kind === "avatar" ? 600 : 1600,
        maxHeight: kind === "avatar" ? 600 : 800,
        quality: 0.82,
        mimeType: "image/webp",
      });

      const formData = new FormData();
      formData.append("file", compressedFile);
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

  const handleSaveProfile = async (
    payload: Record<string, unknown>
  ) => {
    setSaving(true);

    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  const handleUpdatePaymentStatus = async (bookingId: string, newPaymentStatus: string) => {
    try {
      const res = await fetch("/api/dashboard/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, paymentStatus: newPaymentStatus }),
      });

      if (!res.ok) throw new Error("Error al actualizar estado de seña");

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, paymentStatus: newPaymentStatus } : b))
      );
      showNotification(
        "success",
        newPaymentStatus === "PAID"
          ? "Seña marcada como acreditada"
          : "Seña marcada como pendiente"
      );
    } catch {
      showNotification("error", "No se pudo actualizar el estado de la seña");
    }
  };

  const handleSendManualReminder = async (bookingId: string) => {
    setSendingReminderId(bookingId);
    try {
      const res = await fetch(`/api/dashboard/bookings/${bookingId}/reminder`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar recordatorio");

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, reminder24hSent: true } : b
        )
      );
      showNotification("success", data.message || "Recordatorio enviado.");
    } catch (err: unknown) {
      showNotification(
        "error",
        err instanceof Error ? err.message : "Error al enviar recordatorio"
      );
    } finally {
      setSendingReminderId(null);
    }
  };

  const handleSaveDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDeposit(true);
    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depositRequired,
          depositPercentage: depositPercentage.trim() ? Number(depositPercentage) : null,
          depositAmount: depositAmount.trim() ? Number(depositAmount) : null,
          bankAlias,
          bankCbu,
          bankHolder,
          depositNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar configuración");

      setProfile((prev) => (prev ? { ...prev, ...data.profile } : data.profile));
      showNotification("success", "Configuración de señas guardada");
    } catch (err: unknown) {
      showNotification(
        "error",
        err instanceof Error ? err.message : "Error al guardar señas"
      );
    } finally {
      setSavingDeposit(false);
    }
  };

  const resetServiceForm = () => {
    setEditingServiceId(null);
    setServiceName("");
    setServiceDescription("");
    setServiceDuration(30);
    setServicePrice("");
  };

  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingService(true);
    try {
      const isEdit = Boolean(editingServiceId);
      const res = await fetch("/api/dashboard/services", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEdit ? { id: editingServiceId } : {}),
          name: serviceName,
          description: serviceDescription,
          duration: Number(serviceDuration),
          price: servicePrice.trim() ? Number(servicePrice) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar el tipo de turno");

      if (isEdit) {
        setServices((prev) =>
          prev.map((s) => (s.id === data.service.id ? data.service : s))
        );
        showNotification("success", "Tipo de turno actualizado");
      } else {
        setServices((prev) => [...prev, data.service]);
        showNotification("success", "Tipo de turno agregado");
      }
      resetServiceForm();
    } catch (err: unknown) {
      showNotification(
        "error",
        err instanceof Error ? err.message : "No se pudo guardar el servicio"
      );
    } finally {
      setSavingService(false);
    }
  };

  const handleToggleService = async (srv: ServiceItem) => {
    try {
      const res = await fetch("/api/dashboard/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: srv.id, isActive: !srv.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar estado");
      setServices((prev) =>
        prev.map((s) => (s.id === srv.id ? data.service : s))
      );
    } catch (err: unknown) {
      showNotification(
        "error",
        err instanceof Error ? err.message : "Error al cambiar estado"
      );
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/services?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar");
      setServices((prev) => prev.filter((s) => s.id !== id));
      if (editingServiceId === id) resetServiceForm();
      showNotification("success", "Tipo de turno eliminado");
    } catch (err: unknown) {
      showNotification(
        "error",
        err instanceof Error ? err.message : "Error al eliminar"
      );
    }
  };

  const resetStaffForm = () => {
    setStaffName("");
    setStaffRole("");
    setStaffEmail("");
    setStaffPhone("");
    setStaffCommissionPercentage("");
    setStaffAvatarUrl("");
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStaff(true);
    try {
      const res = await fetch("/api/dashboard/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: staffName,
          role: staffRole,
          email: staffEmail,
          phone: staffPhone,
          commissionPercentage: staffCommissionPercentage ? Number(staffCommissionPercentage) : 0,
          avatarUrl: staffAvatarUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al agregar el profesional");

      setStaffMembers((prev) => [...prev, data.staffMember]);
      showNotification("success", "Profesional agregado al equipo");
      resetStaffForm();
    } catch (err: unknown) {
      showNotification(
        "error",
        err instanceof Error ? err.message : "No se pudo guardar el profesional"
      );
    } finally {
      setSavingStaff(false);
    }
  };

  const handleStartEditStaff = (staff: StaffMemberItem) => {
    if (editingStaffId === staff.id) {
      setEditingStaffId(null);
    } else {
      setEditingStaffId(staff.id);
      setEditStaffName(staff.name);
      setEditStaffRole(staff.role || "");
      setEditStaffEmail(staff.email || "");
      setEditStaffPhone(staff.phone || "");
      setEditStaffCommissionPercentage(
        staff.commissionPercentage !== undefined && staff.commissionPercentage !== null
          ? String(staff.commissionPercentage)
          : "0"
      );
      setEditStaffAvatarUrl(staff.avatarUrl || "");
    }
  };

  const handleSaveEditStaff = async (e: React.FormEvent, staffId: string) => {
    e.preventDefault();
    setSavingEditStaff(true);
    try {
      const res = await fetch("/api/dashboard/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: staffId,
          name: editStaffName,
          role: editStaffRole,
          email: editStaffEmail,
          phone: editStaffPhone,
          commissionPercentage: editStaffCommissionPercentage ? Number(editStaffCommissionPercentage) : 0,
          avatarUrl: editStaffAvatarUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar profesional");

      setStaffMembers((prev) =>
        prev.map((s) => (s.id === data.staffMember.id ? data.staffMember : s))
      );
      showNotification("success", "Profesional actualizado");
      setEditingStaffId(null);
    } catch (err: unknown) {
      showNotification(
        "error",
        err instanceof Error ? err.message : "No se pudo actualizar el profesional"
      );
    } finally {
      setSavingEditStaff(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/dashboard/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: newStatus }),
      });
      if (!res.ok) throw new Error("Error al actualizar estado");
      const data = await res.json();
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, ...data.booking } : b))
      );
      showNotification(
        "success",
        `Turno marcado como ${newStatus === "COMPLETED" ? "completado" : newStatus === "CANCELLED" ? "cancelado" : "confirmado"}`
      );
    } catch {
      showNotification("error", "No se pudo actualizar el turno");
    }
  };

  const handleUpdateBookingStaff = async (bookingId: string, staffMemberId: string) => {
    try {
      const res = await fetch("/api/dashboard/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, staffMemberId: staffMemberId || null }),
      });
      if (!res.ok) throw new Error("Error al asignar profesional");
      const data = await res.json();
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, ...data.booking } : b))
      );
      showNotification("success", "Profesional asignado correctamente");
    } catch {
      showNotification("error", "No se pudo asignar el profesional");
    }
  };

  const handleUpdateBookingPrice = async (bookingId: string, price: number) => {
    try {
      const res = await fetch("/api/dashboard/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, servicePrice: price }),
      });
      if (!res.ok) throw new Error("Error al actualizar precio");
      const data = await res.json();
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, ...data.booking } : b))
      );
      showNotification("success", "Precio actualizado correctamente");
      setEditingPriceBookingId(null);
    } catch {
      showNotification("error", "No se pudo actualizar el precio");
    }
  };

  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingManualBooking(true);
    try {
      const res = await fetch("/api/dashboard/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: manualCustomerName || "Cliente en local",
          customerPhone: manualCustomerPhone,
          date: manualDate,
          startTime: manualStartTime,
          serviceId: manualServiceId || null,
          staffMemberId: manualStaffMemberId || null,
          servicePrice: manualServicePrice ? Number(manualServicePrice) : null,
          status: manualStatus,
          notes: manualNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al registrar turno");

      setBookings((prev) => [data.booking, ...prev]);
      showNotification("success", "Turno registrado con éxito");
      setShowManualModal(false);
      setManualCustomerName("Cliente en local");
      setManualCustomerPhone("");
      setManualNotes("");
    } catch (err: unknown) {
      showNotification(
        "error",
        err instanceof Error ? err.message : "Error al registrar turno"
      );
    } finally {
      setSavingManualBooking(false);
    }
  };

  const handleUploadEditStaffPhoto = async (file: File) => {
    setUploadingEditStaffPhoto(true);
    try {
      const compressedFile = await compressImageFile(file, {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.82,
        mimeType: "image/webp",
      });

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("kind", "avatar");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir imagen");
      setEditStaffAvatarUrl(data.url);
      showNotification("success", "Foto del profesional actualizada");
    } catch (err: unknown) {
      showNotification(
        "error",
        err instanceof Error ? err.message : "Error al subir foto"
      );
    } finally {
      setUploadingEditStaffPhoto(false);
    }
  };

  const handleToggleStaff = async (staff: StaffMemberItem) => {
    try {
      const res = await fetch("/api/dashboard/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: staff.id, isActive: !staff.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar estado");
      setStaffMembers((prev) =>
        prev.map((s) => (s.id === staff.id ? data.staffMember : s))
      );
      showNotification(
        "success",
        !staff.isActive ? "Profesional activado" : "Profesional pausado"
      );
    } catch (err: unknown) {
      showNotification(
        "error",
        err instanceof Error ? err.message : "Error al cambiar estado"
      );
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("¿Seguro que querés eliminar este profesional del equipo?")) return;
    try {
      const res = await fetch(`/api/dashboard/staff?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar profesional");
      setStaffMembers((prev) => prev.filter((s) => s.id !== id));
      if (editingStaffId === id) resetStaffForm();
      showNotification("success", "Profesional eliminado del equipo");
    } catch (err: unknown) {
      showNotification(
        "error",
        err instanceof Error ? err.message : "No se pudo eliminar el profesional"
      );
    }
  };

  const handleUploadStaffPhoto = async (file: File) => {
    setUploadingStaffPhoto(true);
    try {
      // Compress staff photo before uploading
      const compressedFile = await compressImageFile(file, {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.82,
        mimeType: "image/webp",
      });

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("kind", "avatar");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir imagen");
      setStaffAvatarUrl(data.url);
      showNotification("success", "Foto del profesional subida");
    } catch (err: unknown) {
      showNotification(
        "error",
        err instanceof Error ? err.message : "Error al subir foto"
      );
    } finally {
      setUploadingStaffPhoto(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  // Control Tab calculations & filtering
  const filteredControlBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (b.status === "CANCELLED") return false;

      if (controlStaffFilter !== "all" && b.staffMemberId !== controlStaffFilter) {
        return false;
      }

      if (controlPeriod === "today") {
        return b.date === todayStr;
      }
      if (controlPeriod === "week") {
        return b.date >= mondayStr;
      }
      if (controlPeriod === "month") {
        return b.date.startsWith(currentYearMonth);
      }
      return true; // "all"
    });
  }, [bookings, controlPeriod, controlStaffFilter, todayStr, mondayStr, currentYearMonth]);

  const controlStats = useMemo(() => {
    let totalRevenue = 0;
    let totalStaffCommissions = 0;
    const totalBookings = filteredControlBookings.length;
    let completedBookings = 0;

    filteredControlBookings.forEach((b) => {
      const price = b.servicePrice ?? b.service?.price ?? 0;
      const staff = staffMembers.find((s) => s.id === b.staffMemberId);
      const commissionPct = staff?.commissionPercentage ?? b.staffMember?.commissionPercentage ?? 0;
      const staffCut = Math.round((price * commissionPct) / 100);

      totalRevenue += price;
      totalStaffCommissions += staffCut;
      if (b.status === "COMPLETED") completedBookings++;
    });

    const netProfit = totalRevenue - totalStaffCommissions;

    return {
      totalBookings,
      completedBookings,
      totalRevenue,
      totalStaffCommissions,
      netProfit,
    };
  }, [filteredControlBookings, staffMembers]);

  const staffBreakdowns = useMemo(() => {
    return staffMembers.map((staff) => {
      const staffBookings = filteredControlBookings.filter((b) => b.staffMemberId === staff.id);
      let revenue = 0;
      staffBookings.forEach((b) => {
        const price = b.servicePrice ?? b.service?.price ?? 0;
        revenue += price;
      });
      const commissionPct = staff.commissionPercentage || 0;
      const commissionEarned = Math.round((revenue * commissionPct) / 100);
      const businessRetained = revenue - commissionEarned;

      return {
        staff,
        bookingCount: staffBookings.length,
        revenue,
        commissionPct,
        commissionEarned,
        businessRetained,
      };
    });
  }, [filteredControlBookings, staffMembers]);

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
            <Link
              href="/pricing"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 transition"
              title="Ver planes y suscripciones"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Planes</span>
            </Link>

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
            onClick={() => setActiveTab("CONTROL")}
            className={`px-3.5 py-1.5 rounded-full font-medium transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "CONTROL"
                ? "bg-white text-zinc-950 font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Control & Caja</span>
          </button>

          <button
            onClick={() => setActiveTab("SERVICES")}
            className={`px-3.5 py-1.5 rounded-full font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === "SERVICES"
                ? "bg-white text-zinc-950 font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Tipos de Turno ({services.length})
          </button>

          <button
            onClick={() => setActiveTab("STAFF")}
            className={`px-3.5 py-1.5 rounded-full font-medium transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "STAFF"
                ? "bg-white text-zinc-950 font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Equipo ({staffMembers.length})</span>
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
            onClick={() => setActiveTab("DEPOSIT")}
            className={`px-3.5 py-1.5 rounded-full font-medium transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "DEPOSIT"
                ? "bg-white text-zinc-950 font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Señas & No-Shows</span>
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
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-medium text-white bg-zinc-800 px-2.5 py-0.5 rounded-md">
                            {b.startTime} - {b.endTime} hs
                          </span>
                          {b.managementCode && (
                            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                              {b.managementCode}
                            </span>
                          )}
                        </div>
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
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {b.serviceName && (
                          <span className="px-2 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-[11px] font-medium text-zinc-200">
                            {b.serviceName}
                          </span>
                        )}
                        {b.staffMemberName && (
                          <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-zinc-300 flex items-center gap-1">
                            <User className="w-3 h-3 text-zinc-400" />
                            <span>{b.staffMemberName}</span>
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 font-mono mt-1">
                        {formatDateSpanish(b.date)}
                      </div>

                      {/* Payment / Deposit Badge */}
                      {b.paymentStatus === "PENDING" && (
                        <div className="mt-2.5 flex items-center justify-between p-2 rounded-lg bg-amber-950/40 border border-amber-900/60 text-[11px] text-amber-200">
                          <span className="flex items-center gap-1 font-medium">
                            <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>
                              Seña Pendiente {b.depositAmount ? `($${b.depositAmount.toLocaleString("es-AR")})` : ""}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdatePaymentStatus(b.id, "PAID")}
                            className="px-2 py-0.5 rounded bg-amber-400 text-zinc-950 font-semibold text-[10px] hover:bg-amber-300 transition"
                          >
                            Marcar acreditada
                          </button>
                        </div>
                      )}

                      {b.paymentStatus === "PAID" && (
                        <div className="mt-2.5 flex items-center justify-between p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-[11px] text-emerald-300">
                          <span className="flex items-center gap-1 font-medium">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>
                              Seña Acreditada {b.depositAmount ? `($${b.depositAmount.toLocaleString("es-AR")})` : ""}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdatePaymentStatus(b.id, "PENDING")}
                            className="text-[10px] text-zinc-400 hover:text-zinc-200 underline"
                          >
                            Desmarcar
                          </button>
                        </div>
                      )}

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

                    <div className="mt-4 pt-3 border-t border-zinc-800 flex flex-col gap-2">
                      {/* Reminder status / action */}
                      <div className="flex items-center justify-between text-[11px]">
                        {b.reminder24hSent || b.reminder2hSent ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
                            <Bell className="w-3 h-3 text-emerald-400" />
                            <span>Recordatorio enviado</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500 font-mono">Sin recordatorio</span>
                        )}

                        {b.status === "CONFIRMED" && b.customerEmail && (
                          <button
                            type="button"
                            disabled={sendingReminderId === b.id}
                            onClick={() => handleSendManualReminder(b.id)}
                            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-medium transition flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                            title="Enviar correo de recordatorio pre-turno ahora"
                          >
                            {sendingReminderId === b.id ? (
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            ) : (
                              <Send className="w-2.5 h-2.5 text-zinc-400" />
                            )}
                            <span>{b.reminder24hSent ? "Reenviar aviso" : "Enviar aviso"}</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
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
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: CONTROL, RENDICIÓN & CAJA */}
        {activeTab === "CONTROL" && (
          <div className="space-y-6 animate-fade-in">
            {/* Header & Main Action */}
            <div className="rounded-2xl p-5 border border-zinc-800 bg-[#121215] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Control, Rendición & Liquidación de Caja</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5 font-light">
                  Seguimiento de turnos, facturación bruta, comisiones de tu equipo y ganancia neta en tiempo real.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setManualDate(todayStr);
                  setManualCustomerName("Cliente en local");
                  setManualCustomerPhone("");
                  setManualServicePrice(services[0]?.price ? String(services[0].price) : "");
                  setManualServiceId(services[0]?.id || "");
                  setManualStaffMemberId(staffMembers[0]?.id || "");
                  setManualStatus("COMPLETED");
                  setShowManualModal(true);
                }}
                className="px-4 py-2 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Registrar Turno en Local</span>
              </button>
            </div>

            {/* Filters Toolbar */}
            <div className="p-3.5 rounded-2xl border border-zinc-800 bg-[#121215] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                <span className="text-zinc-500 text-[11px] font-medium mr-1 flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Período:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setControlPeriod("today")}
                  className={`px-3 py-1.5 rounded-full font-medium transition cursor-pointer ${
                    controlPeriod === "today"
                      ? "bg-white text-zinc-950 font-semibold"
                      : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                  }`}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => setControlPeriod("week")}
                  className={`px-3 py-1.5 rounded-full font-medium transition cursor-pointer ${
                    controlPeriod === "week"
                      ? "bg-white text-zinc-950 font-semibold"
                      : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                  }`}
                >
                  Esta Semana
                </button>
                <button
                  type="button"
                  onClick={() => setControlPeriod("month")}
                  className={`px-3 py-1.5 rounded-full font-medium transition cursor-pointer ${
                    controlPeriod === "month"
                      ? "bg-white text-zinc-950 font-semibold"
                      : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                  }`}
                >
                  Este Mes
                </button>
                <button
                  type="button"
                  onClick={() => setControlPeriod("all")}
                  className={`px-3 py-1.5 rounded-full font-medium transition cursor-pointer ${
                    controlPeriod === "all"
                      ? "bg-white text-zinc-950 font-semibold"
                      : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                  }`}
                >
                  Todo el Historial
                </button>
              </div>

              {/* Staff filter dropdown */}
              {staffMembers.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-500 text-[11px] whitespace-nowrap">Filtrar por:</span>
                  <select
                    value={controlStaffFilter}
                    onChange={(e) => setControlStaffFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl minimal-input text-xs text-white bg-zinc-900 border border-zinc-800 cursor-pointer"
                  >
                    <option value="all">Todos los colaboradores ({staffMembers.length})</option>
                    {staffMembers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.commissionPercentage || 0}% com.)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 4 KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Turnos Realizados */}
              <div className="p-4 rounded-2xl border border-zinc-800 bg-[#121215] flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-xs font-medium text-zinc-300">Turnos Registrados</span>
                  <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                    <CalendarDays className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-white">
                    {controlStats.totalBookings}
                  </div>
                  <span className="text-[11px] text-zinc-500 mt-0.5 block font-light">
                    {controlStats.completedBookings} completados / atendidos
                  </span>
                </div>
              </div>

              {/* Facturación Bruta */}
              <div className="p-4 rounded-2xl border border-zinc-800 bg-[#121215] flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-xs font-medium text-zinc-300">Facturación Bruta (Caja)</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-950/40 border border-amber-900/40 flex items-center justify-center text-amber-400">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-white">
                    ${controlStats.totalRevenue.toLocaleString("es-AR")}
                  </div>
                  <span className="text-[11px] text-zinc-500 mt-0.5 block font-light">
                    Total generado por servicios
                  </span>
                </div>
              </div>

              {/* Total Comisiones a Liquidar */}
              <div className="p-4 rounded-2xl border border-zinc-800 bg-[#121215] flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-xs font-medium text-zinc-300">Comisiones a Liquidar</span>
                  <div className="w-7 h-7 rounded-lg bg-purple-950/40 border border-purple-900/40 flex items-center justify-center text-purple-400">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-purple-300">
                    ${controlStats.totalStaffCommissions.toLocaleString("es-AR")}
                  </div>
                  <span className="text-[11px] text-zinc-500 mt-0.5 block font-light">
                    Dinero a pagar al equipo
                  </span>
                </div>
              </div>

              {/* Ganancia Neta del Negocio */}
              <div className="p-4 rounded-2xl border border-emerald-900/40 bg-emerald-950/10 flex flex-col justify-between">
                <div className="flex items-center justify-between text-emerald-400 mb-2">
                  <span className="text-xs font-semibold text-emerald-300">Ganancia Neta Local</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-900/60 flex items-center justify-center text-emerald-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    ${controlStats.netProfit.toLocaleString("es-AR")}
                  </div>
                  <span className="text-[11px] text-emerald-300/70 mt-0.5 block font-light">
                    Margen retenido por el negocio
                  </span>
                </div>
              </div>
            </div>

            {/* Individual Staff Breakdown Cards */}
            {staffMembers.length > 0 && (
              <div className="rounded-2xl p-5 border border-zinc-800 bg-[#121215]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Percent className="w-4 h-4 text-emerald-400" />
                      <span>Liquidación y Rendición por Profesional</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5 font-light">
                      Cálculo automático de comisiones según el porcentaje asignado a cada colaborador.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("STAFF")}
                    className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    Editar porcentajes en Equipo
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {staffBreakdowns.map((b) => (
                    <div
                      key={b.staff.id}
                      className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 text-xs font-bold text-white">
                              {b.staff.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={b.staff.avatarUrl}
                                  alt={b.staff.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                b.staff.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-white">{b.staff.name}</div>
                              <div className="text-[10px] text-zinc-400 font-light">{b.staff.role || "Profesional"}</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-900/50">
                            {b.commissionPct}% com.
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs pt-1 border-t border-zinc-800/80">
                          <div className="flex justify-between text-zinc-400 text-[11px]">
                            <span>Turnos realizados:</span>
                            <span className="font-mono text-white font-medium">{b.bookingCount}</span>
                          </div>
                          <div className="flex justify-between text-zinc-400 text-[11px]">
                            <span>Total recaudado:</span>
                            <span className="font-mono text-zinc-200">${b.revenue.toLocaleString("es-AR")}</span>
                          </div>
                          <div className="flex justify-between text-[11px] pt-1 border-t border-zinc-800/50">
                            <span className="text-emerald-400 font-medium">A pagarle ({b.commissionPct}%):</span>
                            <span className="font-mono font-bold text-emerald-300">
                              ${b.commissionEarned.toLocaleString("es-AR")}
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px] text-zinc-500">
                            <span>Queda para el local:</span>
                            <span className="font-mono text-zinc-300">
                              ${b.businessRetained.toLocaleString("es-AR")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setControlStaffFilter(controlStaffFilter === b.staff.id ? "all" : b.staff.id)}
                        className={`mt-3 w-full py-1.5 rounded-lg text-[11px] font-medium transition cursor-pointer border ${
                          controlStaffFilter === b.staff.id
                            ? "bg-white text-zinc-950 border-white font-semibold"
                            : "bg-zinc-800/60 text-zinc-300 border-zinc-700/60 hover:bg-zinc-800"
                        }`}
                      >
                        {controlStaffFilter === b.staff.id ? "Ver todos los barberos" : "Ver solo sus turnos"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Turn Breakdown Table */}
            <div className="rounded-2xl p-5 border border-zinc-800 bg-[#121215]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Historial de Turnos y Quién Realizó Cada Servicio ({filteredControlBookings.length})
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5 font-light">
                    Podés reasignar quién atendió al cliente o modificar el valor cobrado si hubo descuentos o extras.
                  </p>
                </div>
              </div>

              {filteredControlBookings.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl">
                  <CalendarDays className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400 font-medium">
                    No hay turnos registrados en este período.
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Cambiá el filtro de fecha o registrá un turno manual con el botón de arriba.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredControlBookings.map((b) => {
                    const price = b.servicePrice ?? b.service?.price ?? 0;
                    const staff = staffMembers.find((s) => s.id === b.staffMemberId);
                    const commissionPct = staff?.commissionPercentage ?? b.staffMember?.commissionPercentage ?? 0;
                    const staffCut = Math.round((price * commissionPct) / 100);
                    const localCut = price - staffCut;
                    const isEditingPrice = editingPriceBookingId === b.id;

                    return (
                      <div
                        key={b.id}
                        className={`p-4 rounded-xl border transition ${
                          b.status === "COMPLETED"
                            ? "bg-zinc-900/30 border-zinc-800"
                            : "bg-zinc-900/60 border-zinc-700/80"
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          {/* Columna 1: Info del turno */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white">{b.customerName}</span>
                              <span className="text-[11px] font-mono text-zinc-400">
                                {b.date} • {b.startTime} a {b.endTime} hs
                              </span>
                              <span
                                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                                  b.status === "COMPLETED"
                                    ? "bg-emerald-950 text-emerald-300 border border-emerald-900/50"
                                    : "bg-blue-950 text-blue-300 border border-blue-900/50"
                                }`}
                              >
                                {b.status === "COMPLETED" ? "Atendido / Cobrado" : "Agendado"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                              <span>Servicio: <strong className="text-zinc-200">{b.serviceName || "Turno general"}</strong></span>
                              {b.customerPhone && (
                                <a
                                  href={`https://wa.me/${b.customerPhone.replace(/[^\d]/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-zinc-500 hover:text-white flex items-center gap-1 font-mono text-[11px]"
                                >
                                  <Phone className="w-3 h-3 text-emerald-500" />
                                  <span>{b.customerPhone}</span>
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Columna 2: Quién lo atendió (Selector dinámico) */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div>
                              <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                                Realizado por:
                              </label>
                              <select
                                value={b.staffMemberId || ""}
                                onChange={(e) => handleUpdateBookingStaff(b.id, e.target.value)}
                                className="px-2.5 py-1.5 rounded-lg text-xs text-white bg-zinc-950 border border-zinc-700 cursor-pointer font-medium"
                              >
                                <option value="">Sin asignar / Mostrador</option>
                                {staffMembers.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name} ({s.commissionPercentage || 0}% com.)
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Columna 3: Precio y edición rápida */}
                            <div>
                              <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                                Cobrado:
                              </label>
                              {isEditingPrice ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={editingPriceValue}
                                    onChange={(e) => setEditingPriceValue(e.target.value)}
                                    placeholder="0"
                                    className="w-20 px-2 py-1 rounded minimal-input text-xs text-white font-mono"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateBookingPrice(b.id, Number(editingPriceValue))}
                                    className="p-1 rounded bg-emerald-500 text-zinc-950"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingPriceBookingId(null)}
                                    className="p-1 rounded bg-zinc-800 text-zinc-400"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-mono font-bold text-white">
                                    ${price.toLocaleString("es-AR")}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingPriceBookingId(b.id);
                                      setEditingPriceValue(String(price));
                                    }}
                                    title="Modificar precio cobrado"
                                    className="p-1 rounded text-zinc-500 hover:text-white"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Columna 4: Comisión calculada */}
                            <div className="p-2 rounded-lg bg-zinc-950/70 border border-zinc-800 text-right min-w-[140px]">
                              <div className="text-[11px] text-emerald-400 font-semibold font-mono">
                                Com: ${staffCut.toLocaleString("es-AR")} ({commissionPct}%)
                              </div>
                              <div className="text-[10px] text-zinc-400 font-mono">
                                Local: ${localCut.toLocaleString("es-AR")}
                              </div>
                            </div>

                            {/* Columna 5: Acción rápida estado */}
                            <div>
                              {b.status === "CONFIRMED" ? (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateBookingStatus(b.id, "COMPLETED")}
                                  className="px-3 py-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-medium transition cursor-pointer flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Marcar Cobrado</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateBookingStatus(b.id, "CONFIRMED")}
                                  className="text-[11px] text-zinc-500 hover:text-zinc-300 underline"
                                >
                                  Reabrir
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal: Registrar Turno en Local */}
            {showManualModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
                <div className="rounded-2xl border border-zinc-800 bg-[#121215] max-w-lg w-full p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-400" />
                        <span>Registrar Turno / Corte Realizado</span>
                      </h3>
                      <p className="text-xs text-zinc-400 font-light mt-0.5">
                        Cargá un turno presencial para el balance y la liquidación del equipo.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowManualModal(false)}
                      className="p-1 rounded-lg text-zinc-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateManualBooking} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          Nombre del Cliente
                        </label>
                        <input
                          type="text"
                          required
                          value={manualCustomerName}
                          onChange={(e) => setManualCustomerName(e.target.value)}
                          placeholder="Ej: Lucas / Cliente Mostrador"
                          className="w-full px-3 py-2 rounded-xl minimal-input text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          Teléfono / WhatsApp (Opcional)
                        </label>
                        <input
                          type="text"
                          value={manualCustomerPhone}
                          onChange={(e) => setManualCustomerPhone(e.target.value)}
                          placeholder="Ej: 5491122334455"
                          className="w-full px-3 py-2 rounded-xl minimal-input text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          Fecha *
                        </label>
                        <input
                          type="date"
                          required
                          value={manualDate}
                          onChange={(e) => setManualDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl minimal-input text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          Hora *
                        </label>
                        <input
                          type="time"
                          required
                          value={manualStartTime}
                          onChange={(e) => setManualStartTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl minimal-input text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          Profesional / Barbero *
                        </label>
                        <select
                          value={manualStaffMemberId}
                          onChange={(e) => setManualStaffMemberId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl minimal-input text-xs text-white bg-zinc-900"
                        >
                          <option value="">Sin asignar / Mostrador</option>
                          {staffMembers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.commissionPercentage || 0}% com.)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          Tipo de Turno / Servicio
                        </label>
                        <select
                          value={manualServiceId}
                          onChange={(e) => {
                            const sid = e.target.value;
                            setManualServiceId(sid);
                            const found = services.find((s) => s.id === sid);
                            if (found && found.price !== null) {
                              setManualServicePrice(String(found.price));
                            }
                          }}
                          className="w-full px-3 py-2 rounded-xl minimal-input text-xs text-white bg-zinc-900"
                        >
                          <option value="">General / Personalizado</option>
                          {services.map((srv) => (
                            <option key={srv.id} value={srv.id}>
                              {srv.name} {srv.price ? `($${srv.price.toLocaleString("es-AR")})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          Monto Cobrado ($ ARS) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          required
                          value={manualServicePrice}
                          onChange={(e) => setManualServicePrice(e.target.value)}
                          placeholder="Ej: 5000"
                          className="w-full px-3 py-2 rounded-xl minimal-input text-xs text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          Estado Inicial
                        </label>
                        <select
                          value={manualStatus}
                          onChange={(e) => setManualStatus(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl minimal-input text-xs text-white bg-zinc-900"
                        >
                          <option value="COMPLETED">Completado y Cobrado</option>
                          <option value="CONFIRMED">Confirmado (Pendiente)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        Notas adicionales (opcional)
                      </label>
                      <input
                        type="text"
                        value={manualNotes}
                        onChange={(e) => setManualNotes(e.target.value)}
                        placeholder="Ej: Pago en efectivo / Cliente nuevo"
                        className="w-full px-3 py-2 rounded-xl minimal-input text-xs text-white"
                      />
                    </div>

                    <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowManualModal(false)}
                        className="px-4 py-2 rounded-full border border-zinc-800 text-xs text-zinc-400 hover:text-white"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={savingManualBooking}
                        className="px-5 py-2 rounded-full bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {savingManualBooking ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Guardar Turno</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 1B: SERVICES / APPOINTMENT TYPES */}
        {activeTab === "SERVICES" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Add / Edit Form */}
            <form
              onSubmit={handleSubmitService}
              className="lg:col-span-5 rounded-2xl p-5 border border-zinc-800 bg-[#121215] space-y-4 h-fit"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    {editingServiceId ? "Editar tipo de turno" : "Nuevo tipo de turno"}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5 font-light">
                    Ej: Uñas común (30 min), Uñas con diseño (60 min), Pestañas (90 min).
                  </p>
                </div>
                {editingServiceId && (
                  <button
                    type="button"
                    onClick={resetServiceForm}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs text-zinc-300 mb-1">Nombre del servicio *</label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Ej: Uñas con diseño"
                  required
                  className="w-full px-3 py-2 rounded-xl minimal-input text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-300 mb-1.5">
                  Duración del turno (minutos) *
                </label>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {[15, 30, 45, 60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setServiceDuration(mins)}
                      className={`py-1.5 rounded-lg text-xs font-mono border transition cursor-pointer ${
                        Number(serviceDuration) === mins
                          ? "bg-white text-zinc-950 border-white font-semibold"
                          : "bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                      }`}
                    >
                      {mins >= 60 && mins % 60 === 0
                        ? `${mins / 60} h`
                        : `${mins} min`}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <input
                    type="number"
                    min={5}
                    max={480}
                    step={5}
                    value={serviceDuration}
                    onChange={(e) => setServiceDuration(Number(e.target.value))}
                    required
                    className="w-24 px-2.5 py-1.5 rounded-xl minimal-input text-xs text-white font-mono"
                  />
                  <span className="text-xs text-zinc-400">minutos exactos</span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-300 mb-1">Precio (opcional)</label>
                <input
                  type="number"
                  min={0}
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                  placeholder="Ej: 15000 (dejar vacío si no querés mostrar)"
                  className="w-full px-3 py-2 rounded-xl minimal-input text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-300 mb-1">Descripción corta (opcional)</label>
                <textarea
                  rows={2}
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  placeholder="Detalle breve del servicio..."
                  className="w-full px-3 py-2 rounded-xl minimal-input text-xs text-white resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingService}
                className="w-full py-2.5 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-medium transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {savingService ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : editingServiceId ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>{editingServiceId ? "Guardar cambios" : "Agregar tipo de turno"}</span>
              </button>
            </form>

            {/* List of Services */}
            <div className="lg:col-span-7 rounded-2xl p-5 border border-zinc-800 bg-[#121215]">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-white">Tus tipos de turno configurados</h2>
                <p className="text-xs text-zinc-400 mt-0.5 font-light">
                  Tu calendario público calculará los huecos libres automáticamente según cuánto dure el servicio que elija cada cliente.
                </p>
              </div>

              {services.length === 0 ? (
                <div className="p-8 rounded-xl border border-zinc-800/80 bg-zinc-900/20 text-center">
                  <Clock className="w-7 h-7 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-300 font-medium">
                    Todavía no creaste tipos de turno específicos
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1 max-w-sm mx-auto font-light">
                    Mientras no agregues servicios aquí, los clientes reservarán con tu duración por defecto ({slotDuration} min).
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {services.map((srv) => (
                    <div
                      key={srv.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                        srv.isActive
                          ? "bg-zinc-900/40 border-zinc-800"
                          : "bg-zinc-950 border-zinc-900 opacity-55"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-white">{srv.name}</span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-200">
                            {srv.duration} min
                          </span>
                          {srv.price !== null && (
                            <span className="text-[11px] font-mono text-zinc-300">
                              ${srv.price.toLocaleString("es-AR")}
                            </span>
                          )}
                          {!srv.isActive && (
                            <span className="text-[10px] font-mono text-zinc-500 uppercase">
                              Pausado
                            </span>
                          )}
                        </div>
                        {srv.description && (
                          <p className="text-[11px] text-zinc-400 font-light">{srv.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleService(srv)}
                          className="px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-[11px] text-zinc-300 transition"
                        >
                          {srv.isActive ? "Pausar" : "Activar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingServiceId(srv.id);
                            setServiceName(srv.name);
                            setServiceDescription(srv.description || "");
                            setServiceDuration(srv.duration);
                            setServicePrice(srv.price !== null ? String(srv.price) : "");
                          }}
                          title="Editar"
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteService(srv.id)}
                          title="Eliminar"
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: STAFF / EQUIPO */}
        {activeTab === "STAFF" && (
          <div className="space-y-6">
            {/* Create Staff Form (Siempre limpio para crear nuevos) */}
            <div className="rounded-2xl p-5 sm:p-6 border border-zinc-800 bg-[#121215]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Agregar Miembro al Equipo
                    </h2>
                    <p className="text-xs text-zinc-400 font-light">
                      Agregá barberos o especialistas para que tus clientes puedan elegir con quién atenderse.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Nombre y Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Lucas Gómez"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl minimal-input text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Rol o Especialidad (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="ej. Barbero Senior, Colorista, Nail Artist"
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl minimal-input text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Email del profesional (opcional)
                    </label>
                    <input
                      type="email"
                      placeholder="ej. lucas@gmail.com"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl minimal-input text-xs text-white"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1 font-light">
                      Le enviaremos un correo de aviso automático cada vez que alguien reserve con él.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      WhatsApp / Teléfono (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="ej. 5491122334455"
                      value={staffPhone}
                      onChange={(e) => setStaffPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl minimal-input text-xs text-white font-mono"
                    />
                  </div>
                </div>

                {/* Porcentaje de Comisión */}
                <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-white flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Porcentaje de Comisión (%)</span>
                    </label>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {staffCommissionPercentage
                        ? `${staffCommissionPercentage}% del valor del turno`
                        : "0% (Sueldo fijo / sin comisión)"}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Ej: 25 (para 25%), 15, 40, etc."
                    value={staffCommissionPercentage}
                    onChange={(e) => setStaffCommissionPercentage(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl minimal-input text-xs text-white font-mono"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1 font-light">
                    Porcentaje que se le asigna a este profesional del valor de cada corte o servicio realizado (ej. 15%, 25%, 40%). Podés modificarlo en cualquier momento.
                  </p>
                </div>

                {/* Photo upload for Staff Member */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Foto del profesional (opcional)
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                      {staffAvatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={staffAvatarUrl}
                          alt="Foto"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-zinc-500" />
                      )}
                    </div>

                    <label className="cursor-pointer px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300 font-medium transition flex items-center gap-1.5">
                      {uploadingStaffPhoto ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>{uploadingStaffPhoto ? "Subiendo..." : "Subir foto"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadStaffPhoto(file);
                        }}
                      />
                    </label>

                    {staffAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => setStaffAvatarUrl("")}
                        className="text-xs text-zinc-500 hover:text-rose-400"
                      >
                        Quitar foto
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="submit"
                    disabled={savingStaff}
                    className="px-5 py-2 rounded-full bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-200 transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {savingStaff ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Agregar al Equipo</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Staff List */}
            <div className="rounded-2xl p-5 sm:p-6 border border-zinc-800 bg-[#121215]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">
                  Equipo Actual ({staffMembers.length})
                </h3>
                <span className="text-xs text-zinc-500 font-light">
                  {staffMembers.length === 0
                    ? "Modo individual (1 sola agenda)"
                    : "Modo multi-profesional activo"}
                </span>
              </div>

              {staffMembers.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl">
                  <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400 font-medium">
                    No tenés profesionales agregados en tu equipo
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1 max-w-md mx-auto font-light">
                    Tu perfil funciona actualmente con tu agenda individual única. Agregá barberos o colaboradores arriba para que tus clientes puedan elegir con quién atenderse.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {staffMembers.map((staff) => {
                    const isEditingThisStaff = editingStaffId === staff.id;
                    return (
                      <div
                        key={staff.id}
                        className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                          isEditingThisStaff
                            ? "bg-zinc-900/90 border-zinc-700 ring-1 ring-zinc-700/80 shadow-xl"
                            : staff.isActive
                            ? "bg-zinc-900/40 border-zinc-800"
                            : "bg-zinc-950/40 border-zinc-900 opacity-60"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 text-xs font-bold text-white">
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
                              <div>
                                <div className="text-xs font-semibold text-white">
                                  {staff.name}
                                </div>
                                {staff.role && (
                                  <div className="text-[11px] text-zinc-400 mt-0.5 font-light">
                                    {staff.role}
                                  </div>
                                )}
                              </div>
                            </div>

                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                                staff.isActive
                                  ? "bg-emerald-950/70 text-emerald-300 border border-emerald-900/60"
                                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                              }`}
                            >
                              {staff.isActive ? "Activo" : "Pausado"}
                            </span>
                          </div>

                          <div className="space-y-1 text-[11px] text-zinc-400 font-light mt-2">
                            {staff.email && (
                              <div className="truncate">✉️ {staff.email}</div>
                            )}
                            {staff.phone && (
                              <div className="font-mono">📱 {staff.phone}</div>
                            )}
                            <div className="pt-1 flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-950/40 text-emerald-300 border border-emerald-900/50">
                                <Percent className="w-3 h-3 text-emerald-400" />
                                <span>Comisión: {staff.commissionPercentage || 0}%</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => handleToggleStaff(staff)}
                            className="text-xs text-zinc-400 hover:text-white font-medium"
                          >
                            {staff.isActive ? "Pausar" : "Activar"}
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEditStaff(staff)}
                              title={isEditingThisStaff ? "Cerrar edición" : "Editar datos"}
                              className={`p-1.5 rounded-lg transition ${
                                isEditingThisStaff
                                  ? "bg-white text-zinc-950 font-bold"
                                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                              }`}
                            >
                              {isEditingThisStaff ? (
                                <X className="w-3.5 h-3.5" />
                              ) : (
                                <Pencil className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(staff.id)}
                              title="Eliminar"
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* DESPLEGABLE INLINE: Edición directa debajo de la tarjeta del trabajador */}
                        {isEditingThisStaff && (
                          <form
                            onSubmit={(e) => handleSaveEditStaff(e, staff.id)}
                            className="mt-4 pt-4 border-t border-zinc-700/80 space-y-3 animate-fade-in text-left"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-zinc-200">
                                Editar a {staff.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingStaffId(null)}
                                className="text-[11px] text-zinc-400 hover:text-white"
                              >
                                Cerrar
                              </button>
                            </div>

                            <div>
                              <label className="block text-[11px] text-zinc-400 mb-1">
                                Nombre y Apellido *
                              </label>
                              <input
                                type="text"
                                required
                                value={editStaffName}
                                onChange={(e) => setEditStaffName(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg minimal-input text-xs text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] text-zinc-400 mb-1">
                                Rol / Especialidad
                              </label>
                              <input
                                type="text"
                                placeholder="ej. Barbero Senior, Colorista"
                                value={editStaffRole}
                                onChange={(e) => setEditStaffRole(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg minimal-input text-xs text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] text-zinc-400 mb-1">
                                Email
                              </label>
                              <input
                                type="email"
                                placeholder="ej. barbero@gmail.com"
                                value={editStaffEmail}
                                onChange={(e) => setEditStaffEmail(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg minimal-input text-xs text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] text-zinc-400 mb-1">
                                WhatsApp / Teléfono
                              </label>
                              <input
                                type="text"
                                placeholder="ej. 5491122334455"
                                value={editStaffPhone}
                                onChange={(e) => setEditStaffPhone(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg minimal-input text-xs text-white font-mono"
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] text-zinc-400 flex items-center gap-1">
                                  <Percent className="w-3 h-3 text-emerald-400" />
                                  <span>% Comisión</span>
                                </label>
                                <span className="text-[10px] font-mono text-zinc-400">
                                  {editStaffCommissionPercentage ? `${editStaffCommissionPercentage}%` : "0%"}
                                </span>
                              </div>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="Ej: 25"
                                value={editStaffCommissionPercentage}
                                onChange={(e) => setEditStaffCommissionPercentage(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg minimal-input text-xs text-white font-mono"
                              />
                            </div>

                            {/* Photo upload for Inline Edit */}
                            <div>
                              <label className="block text-[11px] text-zinc-400 mb-1">
                                Foto del profesional
                              </label>
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 text-xs">
                                  {editStaffAvatarUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={editStaffAvatarUrl}
                                      alt="Foto"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <User className="w-3.5 h-3.5 text-zinc-500" />
                                  )}
                                </div>

                                <label className="cursor-pointer px-2.5 py-1 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-200 font-medium transition flex items-center gap-1">
                                  {uploadingEditStaffPhoto ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Upload className="w-3 h-3" />
                                  )}
                                  <span>{uploadingEditStaffPhoto ? "Subiendo..." : "Cambiar foto"}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleUploadEditStaffPhoto(file);
                                    }}
                                  />
                                </label>

                                {editStaffAvatarUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setEditStaffAvatarUrl("")}
                                    className="text-[10px] text-zinc-400 hover:text-rose-400"
                                  >
                                    Quitar
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingStaffId(null)}
                                className="px-3 py-1 rounded-full border border-zinc-700 text-zinc-300 text-xs hover:bg-zinc-800 transition"
                              >
                                Cancelar
                              </button>
                              <button
                                type="submit"
                                disabled={savingEditStaff}
                                className="px-4 py-1 rounded-full bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-200 transition flex items-center gap-1.5 disabled:opacity-50"
                              >
                                {savingEditStaff ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                                <span>Guardar cambios</span>
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: AVAILABILITY CONFIG */}
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
                      await handleSaveProfile({ timezone, slotDuration, cancelNoticeHours: Number(cancelNoticeHours) });
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

            {/* CANCELLATION & RESCHEDULING NOTICE POLICY CARD */}
            <div className="rounded-2xl p-5 border border-zinc-800 bg-[#121215]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-emerald-400" />
                    <span>Cancelación & Reprogramación con 1 Clic</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5 font-light">
                    Tus clientes reciben un código y enlace directo para cancelar o reprogramar su turno online. Definí con cuánta antelación permitís que lo hagan.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSaveProfile({ cancelNoticeHours: Number(cancelNoticeHours) })}
                  disabled={saving}
                  className="px-4 py-2 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Guardar Política</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <label className="block text-xs font-medium text-white mb-0.5">
                    Antelación mínima requerida:
                  </label>
                  <p className="text-[11px] text-zinc-400 font-light max-w-lg leading-relaxed">
                    Si el cliente intenta cancelar o reprogramar cuando falte menos que este tiempo, la acción se bloqueará y se le indicará que se comunique directamente por WhatsApp con el local.
                  </p>
                </div>

                <select
                  value={cancelNoticeHours}
                  onChange={(e) => setCancelNoticeHours(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl minimal-input text-xs text-white min-w-[260px]"
                >
                  <option value={0}>Sin límite (en cualquier momento hasta la hora del turno)</option>
                  <option value={2}>Hasta 2 horas antes del turno</option>
                  <option value={4}>Hasta 4 horas antes del turno</option>
                  <option value={6}>Hasta 6 horas antes del turno</option>
                  <option value={12}>Hasta 12 horas antes del turno</option>
                  <option value={24}>Hasta 24 horas antes del turno (1 día)</option>
                  <option value={48}>Hasta 48 horas antes del turno (2 días)</option>
                </select>
              </div>
            </div>

            {/* AUTOMATED PRE-APPOINTMENT REMINDERS CARD */}
            <div className="rounded-2xl p-5 border border-zinc-800 bg-[#121215]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-400" />
                    <span>Recordatorios Automáticos Pre-Turno (Anti-Ausentismo)</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5 font-light">
                    Envía un correo automático a tus clientes 24 horas y/o 2 horas antes de la cita con el detalle del turno y botón de autogestión. Reduce el ausentismo (no-shows) hasta un 70%.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSaveProfile({ enableReminders, reminderTiming })}
                  disabled={saving}
                  className="px-4 py-2 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Guardar Recordatorios</span>
                </button>
              </div>

              {/* Toggle switch */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-center justify-between mb-4">
                <div>
                  <span className="block text-xs font-semibold text-white">
                    Activar envíos automáticos de recordatorio
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5 font-light">
                    Tus clientes recibirán el aviso por email para confirmar su asistencia o reprogramar a tiempo.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableReminders}
                    onChange={(e) => setEnableReminders(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Timing selector */}
              {enableReminders && (
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <label className="block text-xs font-medium text-white mb-0.5">
                      Frecuencia y anticipación:
                    </label>
                    <p className="text-[11px] text-zinc-400 font-light max-w-lg leading-relaxed">
                      Elegí en qué momentos se enviará el recordatorio por correo antes de la hora fijada del turno.
                    </p>
                  </div>

                  <select
                    value={reminderTiming}
                    onChange={(e) => setReminderTiming(e.target.value)}
                    className="px-3 py-2 rounded-xl minimal-input text-xs text-white min-w-[280px]"
                  >
                    <option value="BOTH">24 hs antes y 2 hs antes (Recomendado - 70% menos ausentismo)</option>
                    <option value="24H">Solo 24 horas antes del turno</option>
                    <option value="2H">Solo 2 horas antes del turno</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: DEPOSIT & NO-SHOWS */}
        {activeTab === "DEPOSIT" && (
          <form onSubmit={handleSaveDeposit} className="space-y-4">
            <div className="rounded-2xl p-5 border border-zinc-800 bg-[#121215]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>Señas Bancarias & Política Anti No-Shows</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5 font-light">
                    Exigí un anticipo por transferencia para confirmar reservas y evitar clientes que no asisten.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={savingDeposit}
                  className="px-4 py-2 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingDeposit ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Guardar Señas</span>
                </button>
              </div>

              {/* Toggle switch */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-center justify-between mb-5">
                <div>
                  <span className="block text-xs font-semibold text-white">
                    Activar solicitud de seña bancaria
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5 font-light">
                    Los clientes verán tus datos bancarios al reservar y deberán enviarte el comprobante de pago por WhatsApp.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={depositRequired}
                    onChange={(e) => setDepositRequired(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Porcentaje de la seña */}
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Porcentaje de la seña (%)</span>
                    </label>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-900/50">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mb-2">
                    Porcentaje que elegís cobrar sobre el precio del servicio (ej: 50% de un corte de $10.000 = $5.000).
                  </p>
                  <div className="flex items-center rounded-xl minimal-input px-3">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={depositPercentage}
                      onChange={(e) => setDepositPercentage(e.target.value)}
                      placeholder="Ej: 50"
                      className="w-full py-2 bg-transparent text-xs text-white outline-none font-mono"
                    />
                    <span className="text-xs text-zinc-400 font-mono ml-1">%</span>
                  </div>
                </div>

                {/* Monto fijo de respaldo */}
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                  <label className="block text-xs font-semibold text-white mb-1">
                    Monto fijo de respaldo ($ ARS) (Opcional)
                  </label>
                  <p className="text-[11px] text-zinc-400 mb-2">
                    Se utilizará solo si el turno elegido no tiene un precio definido.
                  </p>
                  <div className="flex items-center rounded-xl minimal-input px-3">
                    <span className="text-xs text-zinc-400 font-mono mr-1">$</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Ej: 3000"
                      className="w-full py-2 bg-transparent text-xs text-white outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Alias */}
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                  <label className="block text-xs font-semibold text-white mb-1">
                    Alias bancario o billetera virtual
                  </label>
                  <p className="text-[11px] text-zinc-400 mb-2">
                    Tu Alias de Mercado Pago, Ualá o banco (fácil de copiar para el cliente).
                  </p>
                  <input
                    type="text"
                    value={bankAlias}
                    onChange={(e) => setBankAlias(e.target.value)}
                    placeholder="Ej: barberia.estilo.mp"
                    className="w-full px-3 py-2 rounded-xl minimal-input text-xs text-white font-mono"
                  />
                </div>

                {/* Titular */}
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                  <label className="block text-xs font-semibold text-white mb-1">
                    Nombre del titular
                  </label>
                  <p className="text-[11px] text-zinc-400 mb-2">
                    Para que el cliente verifique a quién le transfiere.
                  </p>
                  <input
                    type="text"
                    value={bankHolder}
                    onChange={(e) => setBankHolder(e.target.value)}
                    placeholder="Ej: Juan Perez"
                    className="w-full px-3 py-2 rounded-xl minimal-input text-xs text-white"
                  />
                </div>

                {/* CBU / CVU */}
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 md:col-span-2">
                  <label className="block text-xs font-semibold text-white mb-1">
                    CBU o CVU (Opcional)
                  </label>
                  <p className="text-[11px] text-zinc-400 mb-2">
                    22 dígitos para transferencias tradicionales.
                  </p>
                  <input
                    type="text"
                    maxLength={22}
                    value={bankCbu}
                    onChange={(e) => setBankCbu(e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="Ej: 0000003100010000000000"
                    className="w-full px-3 py-2 rounded-xl minimal-input text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Indicaciones / Notas */}
              <div className="mt-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                <label className="block text-xs font-semibold text-white mb-1">
                  Instrucciones o política de reserva (Opcional)
                </label>
                <p className="text-[11px] text-zinc-400 mb-2">
                  Aparecerá en la pantalla del cliente y en los correos de confirmación.
                </p>
                <textarea
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  rows={2}
                  placeholder="Ej: Tenés 2 horas para enviar el comprobante de transferencia por WhatsApp. En caso contrario, el turno se libera automáticamente."
                  className="w-full px-3 py-2 rounded-xl minimal-input text-xs text-white resize-none"
                />
              </div>

              {/* Banner informativo */}
              <div className="mt-4 p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/20 text-xs text-zinc-400 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-[11px] leading-relaxed">
                  <p>
                    <strong className="text-zinc-200">¿Cómo funciona?</strong> Cuando un cliente complete su reserva, verá el monto de la seña junto con tus datos bancarios y un botón para copiar tu Alias con 1 click.
                  </p>
                  <p>
                    Al abrir WhatsApp, el mensaje vendrá pre-redactado solicitándole que te adjunte la captura del comprobante. En tu panel de <strong>Turnos</strong>, cada reserva aparecerá con la etiqueta <span className="text-amber-300 font-semibold">Seña Pendiente</span> y podrás marcarla como <span className="text-emerald-300 font-semibold">Acreditada</span> con un solo botón una vez que recibas el dinero.
                  </p>
                </div>
              </div>
            </div>
          </form>
        )}
        {activeTab === "DESIGN" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveProfile({
                name,
                title,
                bio,
                avatarUrl: avatarUrl || null,
                bannerUrl: bannerUrl || null,
                template,
                slug,
              });
            }}
            className="space-y-4"
          >
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
                      minLength={3}
                      onChange={(e) =>
                        setSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-_]/g, "")
                        )
                      }
                      required
                      className="w-full py-2 px-1 bg-transparent text-xs text-white outline-none font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Mínimo 3 caracteres (solo letras minúsculas, números o guiones).
                  </p>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* TAB 4: CONTACT & LOCATION */}
        {activeTab === "CONTACT" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveProfile({ whatsapp, instagram, address, addressUrl });
            }}
            className="space-y-4"
          >
            <div className="rounded-2xl p-5 border border-zinc-800 bg-[#121215]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-sm font-semibold text-white">Canales de Contacto & Ubicación</h2>
                  <p className="text-xs text-zinc-400 mt-0.5 font-light">
                    Configurá tu WhatsApp, Instagram y la dirección física de tu local para que tus clientes te encuentren.
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

                {/* DIRECCIÓN FÍSICA & GOOGLE MAPS */}
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 md:col-span-2 space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="block text-xs font-semibold text-white">
                        Dirección del Local / Consultorio
                      </span>
                      <p className="text-[11px] text-zinc-400 font-light">
                        Aparecerá en tu perfil público con un botón interactivo para abrir la ubicación en Google Maps.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-zinc-300 mb-1">
                        Dirección (Calle, número, barrio o ciudad)
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Ej: Av. Corrientes 1234, CABA"
                        className="w-full px-3 py-2 rounded-xl minimal-input text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-300 mb-1">
                        Enlace personalizado de Google Maps (Opcional)
                      </label>
                      <input
                        type="url"
                        value={addressUrl}
                        onChange={(e) => setAddressUrl(e.target.value)}
                        placeholder="Ej: https://maps.app.goo.gl/... (o dejar vacío)"
                        className="w-full px-3 py-2 rounded-xl minimal-input text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {address.trim() && (
                    <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-zinc-800/60">
                      <span className="text-[11px] text-zinc-400">
                        Hacé clic para confirmar que el pin de Google Maps sea el correcto:
                      </span>
                      <a
                        href={
                          addressUrl.trim()
                            ? addressUrl.trim()
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                address.trim()
                              )}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-emerald-400 border border-zinc-700 flex items-center gap-1.5 transition"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Confirmar y ver en Google Maps</span>
                        <ExternalLink className="w-3 h-3 text-zinc-500" />
                      </a>
                    </div>
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

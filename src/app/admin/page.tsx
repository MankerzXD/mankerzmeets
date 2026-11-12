"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  CalendarCheck,
  AlertOctagon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Search,
  Power,
  RotateCcw,
  LogOut,
  Lock,
} from "lucide-react";

interface TenantItem {
  userId: string;
  email: string;
  role: string;
  createdAt: string;
  profile: {
    id: string;
    slug: string;
    name: string;
    title: string;
    whatsapp: string;
    instagram: string | null;
    status: string;
    template: string;
    bookingsCount: number;
  } | null;
}

interface Metrics {
  totalUsers: number;
  activeProfiles: number;
  suspendedProfiles: number;
  totalBookings: number;
}

const AUTHORIZED_SUPERADMIN_EMAIL = "sanchezmanuel397@gmail.com";

export default function SuperAdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function checkAuthAndLoad() {
      try {
        const authRes = await fetch("/api/auth/me");
        if (!authRes.ok) {
          router.push("/login");
          return;
        }

        const authData = await authRes.json();
        const email = authData.user?.email || "";

        if (email.trim().toLowerCase() !== AUTHORIZED_SUPERADMIN_EMAIL.toLowerCase()) {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        setAuthorized(true);

        const res = await fetch("/api/admin/tenants");
        if (res.ok) {
          const data = await res.json();
          setTenants(data.tenants || []);
          setMetrics(data.metrics || null);
        }
      } catch (err) {
        console.error("SuperAdmin load error:", err);
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndLoad();
  }, [router]);

  const showActionMsg = (type: "success" | "error", text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 3500);
  };

  const handleToggleStatus = async (profileId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setUpdatingId(profileId);

    try {
      const res = await fetch("/api/admin/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar estado");

      setTenants((prev) =>
        prev.map((t) =>
          t.profile?.id === profileId
            ? { ...t, profile: { ...t.profile, status: newStatus } }
            : t
        )
      );

      showActionMsg(
        "success",
        `Perfil ${newStatus === "ACTIVE" ? "activado" : "suspendido"} con éxito.`
      );
    } catch (err: unknown) {
      showActionMsg(
        "error",
        err instanceof Error ? err.message : "Error al cambiar estado"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-300 mb-2" />
        <span className="text-xs font-mono">Verificando credenciales SuperAdmin...</span>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center p-4">
        <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-7 max-w-sm w-full text-center">
          <div className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-base font-bold text-white mb-1.5">403 - Acceso Restringido</h1>
          <p className="text-xs text-zinc-400 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 mb-4 font-light">
            Panel exclusivo para <strong>{AUTHORIZED_SUPERADMIN_EMAIL}</strong>.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/dashboard"
              className="w-full py-2 rounded-xl bg-white text-zinc-950 font-medium text-xs hover:bg-zinc-200 transition"
            >
              Ir a mi panel de usuario
            </Link>
            <button
              onClick={handleLogout}
              className="w-full py-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredTenants = tenants.filter((t) => {
    const q = search.toLowerCase();
    const emailMatch = t.email.toLowerCase().includes(q);
    const nameMatch = t.profile?.name.toLowerCase().includes(q) || false;
    const slugMatch = t.profile?.slug.toLowerCase().includes(q) || false;
    return emailMatch || nameMatch || slugMatch;
  });

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-zinc-800/80 bg-[#0c0c0e]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white text-zinc-950 font-bold text-xs flex items-center justify-center">
              M
            </div>
            <span className="font-semibold text-white text-sm">
              Mankerz Admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs font-mono text-zinc-400">
              {AUTHORIZED_SUPERADMIN_EMAIL}
            </span>
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300 transition"
            >
              Mi Tenant
            </Link>
            <button
              onClick={handleLogout}
              className="p-1.5 text-zinc-400 hover:text-white transition"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin View */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {actionMsg && (
          <div
            className={`fixed bottom-5 right-5 z-50 p-3.5 rounded-xl shadow-lg border text-xs flex items-center gap-2 ${
              actionMsg.type === "success"
                ? "bg-zinc-900 border-zinc-700 text-white"
                : "bg-rose-950/80 border-rose-800 text-rose-200"
            }`}
          >
            {actionMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{actionMsg.text}</span>
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-xl font-bold text-white tracking-tight">
            Control Global de Inquilinos SaaS
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5 font-light">
            Monitoreo de cuentas y control directo de suspensiones por pago.
          </p>
        </div>

        {/* Metrics Grid */}
        {metrics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="rounded-2xl p-4 border border-zinc-800 bg-[#121215]">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-xs">Usuarios</span>
                <Users className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-white mt-1 font-mono">
                {metrics.totalUsers}
              </div>
            </div>

            <div className="rounded-2xl p-4 border border-zinc-800 bg-[#121215]">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-xs">Activos</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-1 font-mono">
                {metrics.activeProfiles}
              </div>
            </div>

            <div className="rounded-2xl p-4 border border-zinc-800 bg-[#121215]">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-xs">Suspendidos</span>
                <AlertOctagon className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold text-rose-400 mt-1 font-mono">
                {metrics.suspendedProfiles}
              </div>
            </div>

            <div className="rounded-2xl p-4 border border-zinc-800 bg-[#121215]">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-xs">Turnos Registrados</span>
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-white mt-1 font-mono">
                {metrics.totalBookings}
              </div>
            </div>
          </div>
        )}

        {/* Tenants List Table */}
        <div className="rounded-2xl p-5 border border-zinc-800 bg-[#121215]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
            <h2 className="text-sm font-semibold text-white">Listado de Tenants</h2>

            <div className="w-full sm:w-64 relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por email o slug..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl minimal-input text-xs text-white"
              />
            </div>
          </div>

          {filteredTenants.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-500 font-light">
              No se encontraron inquilinos con el filtro actual.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 uppercase font-mono text-[10px]">
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Perfil</th>
                    <th className="py-2.5 px-3">WhatsApp</th>
                    <th className="py-2.5 px-3 text-center">Turnos</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredTenants.map((t) => {
                    const isUpdating = updatingId === t.profile?.id;
                    const isSuspended = t.profile?.status === "SUSPENDED";

                    return (
                      <tr key={t.userId} className="hover:bg-zinc-900/30 transition">
                        <td className="py-3 px-3 font-mono">
                          <div className="text-white font-medium">{t.email}</div>
                          <div className="text-[10px] text-zinc-500">
                            Rol: {t.role}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          {t.profile ? (
                            <div>
                              <div className="text-zinc-200 font-medium">{t.profile.name}</div>
                              <Link
                                href={`/${t.profile.slug}`}
                                target="_blank"
                                className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white font-mono"
                              >
                                <span>/{t.profile.slug}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
                            </div>
                          ) : (
                            <span className="text-zinc-600">-</span>
                          )}
                        </td>

                        <td className="py-3 px-3 font-mono text-zinc-400">
                          {t.profile?.whatsapp ? `+${t.profile.whatsapp}` : "-"}
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-medium text-white">
                          {t.profile?.bookingsCount ?? 0}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {t.profile ? (
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono uppercase ${
                                !isSuspended
                                  ? "bg-zinc-800 text-zinc-200"
                                  : "bg-rose-950 text-rose-300"
                              }`}
                            >
                              {!isSuspended ? "Activo" : "Suspendido"}
                            </span>
                          ) : (
                            <span className="text-zinc-600">-</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right">
                          {t.profile ? (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() =>
                                handleToggleStatus(t.profile!.id, t.profile!.status)
                              }
                              className={`px-3 py-1 rounded-lg text-[11px] font-medium transition inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                                !isSuspended
                                  ? "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-zinc-700"
                                  : "bg-white text-zinc-950 hover:bg-zinc-200"
                              }`}
                            >
                              {isUpdating ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : !isSuspended ? (
                                <>
                                  <Power className="w-3 h-3" />
                                  <span>Suspender</span>
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Reactivar</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-zinc-600">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

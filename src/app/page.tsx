"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Share2,
  Lock,
  CalendarCheck,
  Sparkles,
  Check,
  Zap,
  Users,
  BellRing,
  Percent,
  MapPin,
  ShieldCheck,
  Receipt,
  RotateCcw,
} from "lucide-react";

export default function LandingPage() {
  const [selectedDay, setSelectedDay] = useState(14);
  const [selectedSlot, setSelectedSlot] = useState("11:30");
  const [previewConfirmed, setPreviewConfirmed] = useState(false);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-zinc-800 selection:text-white">
      {/* Subtle top ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-64 bg-zinc-800/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-900/80 bg-[#09090b]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-950 font-bold text-sm shadow-sm">
              M
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-white">
                Mankerz Meet
              </span>
              <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
                meet.mankerz.xyz
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition">
              Ventajas
            </a>
            <a href="#pricing" className="hover:text-white transition flex items-center gap-1.5">
              <span>Planes y Precios</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 rounded-full">
                ARS
              </span>
            </a>
            <a href="#preview" className="hover:text-white transition">
              Cómo se ve
            </a>
            <a href="#templates" className="hover:text-white transition">
              Diseños
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-medium text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg transition"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/login"
              className="text-xs font-medium text-zinc-950 bg-white hover:bg-zinc-200 px-4 py-2 rounded-full transition shadow-sm flex items-center gap-1.5"
            >
              <span>Crear mi perfil</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-28 pb-16 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-300 text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Agendamiento autónomo &bull; 100% Mobile First &bull; 0% comisiones</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.12]">
          Tus turnos en piloto automático.{" "}
          <span className="text-zinc-400 font-normal">
            Sin el ida y vuelta por WhatsApp.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto font-light">
          Creá tu perfil profesional con calendario inteligente en 30 segundos. Compartí tu enlace
          en tu bio de Instagram o WhatsApp, reducí el ausentismo y cobrá señas sin fricción.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 font-semibold text-sm transition shadow-lg flex items-center justify-center gap-2 group"
          >
            <span>Crear mi perfil gratis en 30 segundos</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#pricing"
            className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 font-medium text-sm transition flex items-center justify-center gap-2"
          >
            <span>Ver planes y precios</span>
          </a>
        </div>

        <p className="mt-3 text-[11px] text-zinc-500 font-light">
          Sin tarjeta de crédito &bull; Activación inmediata &bull; 14 días de prueba gratis
        </p>

        {/* Minimal Stats Row */}
        <div className="mt-14 pt-8 border-t border-zinc-900 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-2">
            <div className="text-2xl font-semibold text-white tracking-tight">0 contraseñas</div>
            <div className="text-xs text-zinc-500 mt-1">Acceso seguro con código OTP</div>
          </div>
          <div className="p-2">
            <div className="text-2xl font-semibold text-white tracking-tight">30 seg</div>
            <div className="text-xs text-zinc-500 mt-1">Tiempo récord de reserva</div>
          </div>
          <div className="p-2">
            <div className="text-2xl font-semibold text-emerald-400 tracking-tight">-70%</div>
            <div className="text-xs text-zinc-500 mt-1">Menos ausentismo con avisos</div>
          </div>
          <div className="p-2">
            <div className="text-2xl font-semibold text-white tracking-tight">0%</div>
            <div className="text-xs text-zinc-500 mt-1">Comisión por tus turnos</div>
          </div>
        </div>
      </section>

      {/* Pricing & Plans Section (Monetization & Sales) */}
      <section id="pricing" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-zinc-900">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-900/60 bg-emerald-950/30 text-emerald-400 text-xs font-mono mb-4">
            <Zap className="w-3.5 h-3.5" />
            <span>Precios simples y transparentes en pesos argentinos</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Elegí el plan ideal para tu negocio
          </h2>
          <p className="text-zinc-400 text-sm mt-3 max-w-xl mx-auto font-light leading-relaxed">
            Sin comisiones abusivas por turno. Creá tu perfil en 30 segundos y probá todas las
            funciones gratis durante 14 días.
          </p>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Plan 1: Emprendedor */}
          <div className="flex flex-col justify-between p-6 sm:p-7 rounded-2xl border border-zinc-800 bg-[#0d0d10] hover:border-zinc-700 transition">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Plan Emprendedor
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                  1 Profesional
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                    $14.900
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">ARS / mes</span>
                </div>
                <p className="text-xs text-zinc-400 mt-2 font-light leading-relaxed">
                  Ideal para barberos independientes, manicuras, tatuadores, psicólogos y entrenadores
                  personales.
                </p>
              </div>

              <div className="py-4 border-t border-zinc-800/80">
                <p className="text-xs font-medium text-zinc-300 mb-3">Qué incluye:</p>
                <ul className="space-y-2.5 text-xs text-zinc-300 font-light">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white font-medium">Link personalizado</strong>{" "}
                      (meet.mankerz.xyz/tunegocio)
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white font-medium">Acceso seguro con OTP</strong> sin
                      contraseñas
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white font-medium">Turnos ilimitados</strong> (0%
                      comisiones por reserva)
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white font-medium">Autogestión 1-Clic:</strong> el
                      cliente cancela o reprograma solo
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Redirección a WhatsApp y link en bio de Instagram</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>1 prediseño a elección (Minimal Dark o Clean Editorial)</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-800/80 mt-6">
              <Link
                href="/login"
                className="w-full py-3 px-4 rounded-xl border border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 font-medium text-xs transition flex items-center justify-center gap-1.5"
              >
                <span>Crear mi perfil gratis en 30 segundos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Plan 2: Estudio / Pro (Destacado) */}
          <div className="relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl border-2 border-emerald-500/70 bg-[#0e1211] shadow-2xl shadow-emerald-950/20">
            {/* Featured Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-zinc-950 font-bold text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>El más vendido</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Plan Estudio / Pro
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                  Hasta 4 Profesionales
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                    $24.900
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">ARS / mes</span>
                </div>
                <p className="text-xs text-zinc-400 mt-2 font-light leading-relaxed">
                  Para barberías con 2 a 4 sillones, salones de belleza, estéticas y consultorios en
                  crecimiento.
                </p>
              </div>

              <div className="py-4 border-t border-zinc-800/80">
                <p className="text-xs font-medium text-white mb-3">
                  Todo lo del Plan Emprendedor, más:
                </p>
                <ul className="space-y-2.5 text-xs text-zinc-200 font-light">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white font-medium">Hasta 4 agendas</strong> con selección
                      de profesional por el cliente
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white font-medium">Comisiones por Barbero (%):</strong>{" "}
                      asigná porcentajes individuales por corte
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white font-medium">Pestaña de Control y Caja diaria:</strong>{" "}
                      seguimiento en vivo de cortes y liquidación
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white font-medium">
                        Recordatorios automáticos pre-turno:
                      </strong>{" "}
                      emails 24 hs y 2 hs antes anti-ausentismo
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white font-medium">Gestión de señas bancarias:</strong>{" "}
                      Alias, CBU y subida de comprobante
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Elección libre entre Minimal Dark y Clean Editorial + colores</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-800/80 mt-6">
              <Link
                href="/login"
                className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg group"
              >
                <span>Crear mi perfil gratis en 30 segundos</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* Plan 3: Local / Full */}
          <div className="flex flex-col justify-between p-6 sm:p-7 rounded-2xl border border-zinc-800 bg-[#0d0d10] hover:border-zinc-700 transition">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Plan Local / Full
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                  Ilimitado
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                    $39.900
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">ARS / mes</span>
                </div>
                <p className="text-xs text-zinc-400 mt-2 font-light leading-relaxed">
                  Para salones consolidados, clínicas, estudios con múltiples boxes o franquicias.
                </p>
              </div>

              <div className="py-4 border-t border-zinc-800/80">
                <p className="text-xs font-medium text-zinc-300 mb-3">
                  Todo lo del Plan Estudio / Pro, más:
                </p>
                <ul className="space-y-2.5 text-xs text-zinc-300 font-light">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white font-medium">Profesionales ilimitados</strong> en
                      simultáneo
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white font-medium">
                        Reportes avanzados de métricas
                      </strong>{" "}
                      y tasa de ausentismo mensual
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white font-medium">Ubicación con Google Maps:</strong>{" "}
                      GPS en 1 toque en el perfil público
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Banners personalizados y estética de marca personalizada</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white font-medium">Soporte prioritario 1 a 1</strong> y
                      configuración asistida "llave en mano"
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-800/80 mt-6">
              <Link
                href="/login"
                className="w-full py-3 px-4 rounded-xl border border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 font-medium text-xs transition flex items-center justify-center gap-1.5"
              >
                <span>Crear mi perfil gratis en 30 segundos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Reassurance Banner */}
        <div className="mt-12 p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">¿Tenés dudas sobre cómo empezar?</h4>
              <p className="text-xs text-zinc-400 font-light">
                Creá tu perfil ahora mismo. No te pedimos tarjeta de crédito y tenés 14 días para
                usarlo con tus clientes.
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="px-6 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition shrink-0"
          >
            Crear mi perfil gratis en 30 segundos
          </Link>
        </div>
      </section>

      {/* Interactive Product Preview */}
      <section id="preview" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-zinc-900">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            La experiencia de tus clientes
          </h2>
          <p className="text-zinc-400 text-sm mt-2 max-w-md mx-auto font-light">
            Vista móvil ultra-rápida pensada para reservar en segundos desde cualquier smartphone.
          </p>
        </div>

        <div className="max-w-sm mx-auto">
          <div className="rounded-[36px] border border-zinc-800 bg-[#0c0c0e] p-4 shadow-xl">
            <div className="w-20 h-3.5 bg-zinc-900 rounded-full mx-auto mb-4" />

            <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] overflow-hidden">
              <div className="p-4 border-b border-zinc-800/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-sm text-white">
                    M
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-xs">Tu Marca o Barbería</h3>
                    <p className="text-[11px] text-zinc-400 font-mono">meet.mankerz.xyz/tunegocio</p>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-900/60 px-2 py-0.5 rounded-full">
                  Disponible
                </span>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-medium text-white">Calendario mensual</span>
                  <span className="text-[11px] text-zinc-500 font-mono">30 min / turno</span>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-zinc-500 mb-1 font-mono">
                  {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => (
                    <div key={i} className="py-0.5">
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {[...Array(6)].map((_, i) => (
                    <div key={`offset-${i}`} className="py-2 text-zinc-800">
                      -
                    </div>
                  ))}
                  {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((day) => {
                    const isSunday = day % 7 === 0;
                    const isSelected = selectedDay === day;
                    return (
                      <button
                        key={day}
                        disabled={isSunday}
                        onClick={() => {
                          setSelectedDay(day);
                          setPreviewConfirmed(false);
                        }}
                        className={`py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                          isSunday
                            ? "text-zinc-700 opacity-40 cursor-not-allowed"
                            : isSelected
                            ? "bg-white text-zinc-950 font-bold"
                            : "text-zinc-300 hover:bg-zinc-800/80"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 border-t border-zinc-800/60 bg-zinc-900/20">
                <span className="text-[11px] text-zinc-400 block mb-2 font-medium">
                  Turnos libres para el día {selectedDay}:
                </span>

                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {["09:30", "10:30", "11:30", "15:00", "16:30", "17:30"].map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        onClick={() => {
                          setSelectedSlot(slot);
                          setPreviewConfirmed(false);
                        }}
                        className={`py-1.5 text-xs rounded-lg font-mono transition border ${
                          isSelected
                            ? "bg-white border-white text-zinc-950 font-semibold"
                            : "bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        {slot} hs
                      </button>
                    );
                  })}
                </div>

                {previewConfirmed ? (
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-medium text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Turno confirmado</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Día {selectedDay} a las {selectedSlot} hs. Código generado y enviado por email.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => setPreviewConfirmed(true)}
                    className="w-full py-2.5 rounded-xl bg-white text-zinc-950 font-medium text-xs hover:bg-zinc-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>Confirmar turno ({selectedSlot} hs)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Mankerz Meet (Features Section) */}
      <section id="features" className="py-20 px-4 sm:px-6 max-w-5xl mx-auto border-t border-zinc-900">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Diseñado para simplificar tu trabajo diario
          </h2>
          <p className="text-zinc-400 text-sm mt-2 max-w-md mx-auto font-light">
            Menos chats repetitivos, cero contraseñas y todas las herramientas para gestionar tu local.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900/50 transition">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-200 mb-4">
              <RotateCcw className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Autogestión de Turnos</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-light">
              Tus clientes pueden cancelar o reprogramar su turno con 1 clic usando su código único. El
              horario se libera automáticamente para otro cliente.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900/50 transition">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-200 mb-4">
              <Percent className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Comisiones y Caja en Vivo</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-light">
              Asigná porcentajes individuales por barbero o colaborador. El panel calcula en tiempo
              real la liquidación de cortes y los ingresos del día.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900/50 transition">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-200 mb-4">
              <BellRing className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Recordatorios Anti-Ausentismo</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-light">
              Emails automáticos 24 horas y 2 horas antes de cada turno. Reducí los plantones y huecos
              vacíos hasta un 70%.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900/50 transition">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-200 mb-4">
              <Receipt className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Señas por Transferencia</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-light">
              Exigí un anticipo para asegurar el horario. Mostrá tu Alias/CBU y permití al cliente subir
              su comprobante en la misma pantalla.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900/50 transition">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-200 mb-4">
              <MapPin className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Ubicación y Google Maps</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-light">
              Dirección de tu salón con botón directo para abrir Google Maps y activar el GPS en un solo
              toque para que nadie se pierda.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900/50 transition">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-200 mb-4">
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Sin Contraseñas (OTP)</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-light">
              Acceso ultra seguro mediante código de 6 dígitos enviado a tu correo. Nunca más un olvido
              de contraseñas ni problemas de acceso.
            </p>
          </div>
        </div>
      </section>

      {/* 3 Simple Steps */}
      <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto border-t border-zinc-900">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white tracking-tight">Listo en 3 sencillos pasos</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl border border-zinc-800/60 bg-zinc-900/20">
            <span className="text-xs font-mono text-zinc-500 font-bold block mb-2">01</span>
            <h4 className="font-semibold text-white text-sm mb-1">Definí tus Horarios y Equipo</h4>
            <p className="text-xs text-zinc-400 font-light">
              Configurá tus días de atención, profesionales, servicios y si solicitás seña previa.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-800/60 bg-zinc-900/20">
            <span className="text-xs font-mono text-zinc-500 font-bold block mb-2">02</span>
            <h4 className="font-semibold text-white text-sm mb-1">Compartí tu Enlace</h4>
            <p className="text-xs text-zinc-400 font-light">
              Pegá tu link <code>meet.mankerz.xyz/tunegocio</code> en tu bio de Instagram o estado de WhatsApp.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-800/60 bg-zinc-900/20">
            <span className="text-xs font-mono text-zinc-500 font-bold block mb-2">03</span>
            <h4 className="font-semibold text-white text-sm mb-1">Recibí Turnos Confirmados</h4>
            <p className="text-xs text-zinc-400 font-light">
              El cliente elige el horario disponible y recibís la reserva confirmada al instante.
            </p>
          </div>
        </div>
      </section>

      {/* Minimalist Templates Showcase */}
      <section id="templates" className="py-16 px-4 sm:px-6 max-w-4xl mx-auto border-t border-zinc-900">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white tracking-tight">Dos estilos sobrios y minimalistas</h2>
          <p className="text-xs text-zinc-400 mt-1 font-light">
            Elegí cómo se ve tu página pública directamente desde tu panel con 1 toque:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl border border-zinc-800 bg-[#111114]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-zinc-400 uppercase">Plantilla 01</span>
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-950 border border-zinc-600" />
            </div>
            <h4 className="text-sm font-semibold text-white">Minimal Dark</h4>
            <p className="text-xs text-zinc-400 font-light mt-1">
              Fondo oscuro mate con contraste blanco puro sobre negro. Diseñado para barberías,
              estudios creativos, entrenadores y marcas de vanguardia.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-200 bg-[#fafaf9] text-zinc-900">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Plantilla 02</span>
              <span className="w-2.5 h-2.5 rounded-full bg-white border border-zinc-400" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-950">Clean Editorial</h4>
            <p className="text-xs text-zinc-600 font-light mt-1">
              Lienzo claro en tono marfil suave, líneas finas y tipografía editorial. Perfecto para
              consultorios médicos, psicólogos, nutricionistas y estética.
            </p>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 px-4 sm:px-6 max-w-4xl mx-auto text-center border-t border-zinc-900">
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Empezá a automatizar tu agenda hoy mismo
        </h2>
        <p className="mt-4 text-zinc-400 text-sm max-w-md mx-auto font-light">
          Creá tu enlace profesional en 30 segundos. Sin costos ocultos, sin comisiones y con prueba
          completa de 14 días.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/login"
            className="px-8 py-4 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-sm transition shadow-xl flex items-center gap-2 group"
          >
            <span>Crear mi perfil gratis en 30 segundos</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* Floating Mobile CTA */}
      <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden">
        <Link
          href="/login"
          className="w-full py-3.5 px-5 rounded-full bg-white text-zinc-950 font-bold text-xs shadow-2xl flex items-center justify-between border border-zinc-200"
        >
          <span>Crear mi perfil gratis en 30 segundos</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-900 py-10 px-4 sm:px-6 mt-8 text-center text-xs text-zinc-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <a
              href="https://mankerz.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-zinc-300 hover:text-white transition"
            >
              Mankerz
            </a>
            <span>&bull;</span>
            <span>meet.mankerz.xyz</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#pricing" className="hover:text-zinc-300 transition">
              Precios
            </a>
            <Link href="/login" className="hover:text-zinc-300 transition">
              Iniciar Sesión
            </Link>
            <Link href="/admin" className="hover:text-zinc-300 transition">
              SuperAdmin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

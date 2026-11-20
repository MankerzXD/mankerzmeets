"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  ChevronDown,
  HelpCircle,
  Smartphone,
  Lock,
  Percent,
  BellRing,
  MapPin,
  Receipt,
  RotateCcw,
} from "lucide-react";

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "¿Puedo probar el sistema gratis antes de pagar?",
      a: "Sí, totalmente. Podés crear tu cuenta en 30 segundos sin ingresar ninguna tarjeta de crédito. Tenés 14 días de prueba completa para usar tu link con clientes reales y probar todas las funciones.",
    },
    {
      q: "¿Cobran comisión por cada turno reservado?",
      a: "No. En Mankerz Meet pagás únicamente el abono mensual fijo de tu plan. No cobramos comisiones ni porcentajes por los turnos que agendes.",
    },
    {
      q: "¿Cómo se pagan los planes?",
      a: "Podés abonar mensualmente mediante transferencia bancaria (Alias/CBU) o Mercado Pago con débito o crédito. Recibís tu factura correspondiente.",
    },
    {
      q: "¿Puedo cambiar de plan o cancelar en cualquier momento?",
      a: "Sí. No hay contratos forzosos ni permanencia mínima. Si tu negocio crece podés pasar de Emprendedor a Estudio en 1 clic, o dar de baja cuando lo desees.",
    },
    {
      q: "¿Cómo funciona el sistema de comisiones para barberos y colaboradores?",
      a: "En el Plan Estudio y Local podés cargar cada miembro de tu equipo (ej: Barbero 1: 30%, Barbero 2: 40%). El sistema calcula automáticamente la liquidación de cortes del día y del mes en la pestaña de Control.",
    },
    {
      q: "¿Cómo ayudan los recordatorios a evitar que los clientes falten?",
      a: "El sistema envía avisos automáticos por correo 24 horas y 2 horas antes de la cita con los datos del turno y un botón para autogestionar la asistencia, reduciendo el ausentismo (no-shows) hasta un 70%.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-zinc-800 selection:text-white pb-20">
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

          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-zinc-400">
            <Link href="/#features" className="hover:text-white transition">
              Ventajas
            </Link>
            <Link href="/pricing" className="text-white font-semibold flex items-center gap-1.5">
              <span>Planes y Precios</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 rounded-full">
                ARS
              </span>
            </Link>
            <Link href="/#preview" className="hover:text-white transition">
              Cómo se ve
            </Link>
            <Link href="/#templates" className="hover:text-white transition">
              Diseños
            </Link>
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

      {/* Main Pricing Header */}
      <section className="relative pt-16 sm:pt-20 pb-12 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-900/60 bg-emerald-950/30 text-emerald-400 text-xs font-mono mb-5">
          <Zap className="w-3.5 h-3.5" />
          <span>Precios transparentes en pesos argentinos &bull; 0% comisiones</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-[1.15]">
          Elegí el plan ideal para tu negocio
        </h1>

        <p className="mt-4 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto font-light">
          Probá todas las herramientas de agendamiento, control de comisiones y recordatorios gratis por 14 días.
          Sin tarjeta de crédito.
        </p>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-400 font-light">
          <span className="flex items-center gap-1 text-emerald-400">
            <Check className="w-4 h-4" /> 14 días de prueba
          </span>
          <span>&bull;</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <Check className="w-4 h-4" /> Sin comisiones por turno
          </span>
          <span>&bull;</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <Check className="w-4 h-4" /> Cancelás cuando quieras
          </span>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="px-4 sm:px-6 max-w-6xl mx-auto">
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
                  Para barberos independientes, manicuras, tatuadores, psicólogos o entrenadores personales.
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
                      <strong className="text-white font-medium">Acceso seguro con OTP</strong> sin contraseñas
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white font-medium">Turnos ilimitados</strong> (0% comisión por reserva)
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white font-medium">Autogestión 1-Clic:</strong> el cliente cancela o reprograma solo
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
                  Para barberías con 2 a 4 sillones, salones de belleza, estéticas y consultorios en crecimiento.
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
                      <strong className="text-white font-medium">Hasta 4 agendas</strong> con selección de profesional
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white font-medium">Comisiones por Barbero (%):</strong> asigná porcentajes por corte
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white font-medium">Pestaña de Control y Caja diaria:</strong> liquidación de cortes e ingresos en vivo
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white font-medium">Recordatorios automáticos pre-turno:</strong> emails 24h y 2h antes (-70% ausentismo)
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white font-medium">Gestión de señas bancarias:</strong> Alias, CBU y subida de comprobantes
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
                      <strong className="text-white font-medium">Profesionales ilimitados</strong> en simultáneo
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white font-medium">Reportes avanzados de métricas</strong> y tasa de ausentismo mensual
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white font-medium">Ubicación con Google Maps:</strong> GPS en 1 toque en el perfil público
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Banners personalizados y estética de marca personalizada</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white font-medium">Soporte prioritario 1 a 1</strong> y configuración asistida "llave en mano"
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
      </section>

      {/* Feature Comparison Matrix */}
      <section className="py-20 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Comparativa detallada de funciones
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-2 font-light">
            Todo lo que necesitás saber para elegir el plan que mejor se adapta a tu local.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#0d0d10] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-900/40 text-zinc-300">
                  <th className="py-4 px-6 font-semibold">Característica</th>
                  <th className="py-4 px-4 font-semibold text-center">Emprendedor ($14.900)</th>
                  <th className="py-4 px-4 font-semibold text-center text-emerald-400">Estudio / Pro ($24.900)</th>
                  <th className="py-4 px-4 font-semibold text-center">Local / Full ($39.900)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                <tr>
                  <td className="py-3.5 px-6 font-medium text-white">Profesionales simultáneos</td>
                  <td className="py-3.5 px-4 text-center">1</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-400">Hasta 4</td>
                  <td className="py-3.5 px-4 text-center font-bold text-white">Ilimitados</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-white">Cantidad de turnos mensuales</td>
                  <td className="py-3.5 px-4 text-center">Ilimitados</td>
                  <td className="py-3.5 px-4 text-center">Ilimitados</td>
                  <td className="py-3.5 px-4 text-center">Ilimitados</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-white">Comisiones del sistema por turno</td>
                  <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">0%</td>
                  <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">0%</td>
                  <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">0%</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-white">Autogestión 1-Clic (cliente cancela o reprograma)</td>
                  <td className="py-3.5 px-4 text-center">
                    <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-white">Control de Caja diaria y liquidación de cortes</td>
                  <td className="py-3.5 px-4 text-center text-zinc-600">—</td>
                  <td className="py-3.5 px-4 text-center">
                    <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-white">Comisiones individuales por barbero (%)</td>
                  <td className="py-3.5 px-4 text-center text-zinc-600">—</td>
                  <td className="py-3.5 px-4 text-center">
                    <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-white">Recordatorios automáticos pre-turno (24h y 2h)</td>
                  <td className="py-3.5 px-4 text-center text-zinc-600">—</td>
                  <td className="py-3.5 px-4 text-center">
                    <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-white">Gestión de señas bancarias por transferencia</td>
                  <td className="py-3.5 px-4 text-center text-zinc-600">—</td>
                  <td className="py-3.5 px-4 text-center">
                    <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-white">Ubicación física y botón Google Maps GPS</td>
                  <td className="py-3.5 px-4 text-center text-zinc-600">—</td>
                  <td className="py-3.5 px-4 text-center text-zinc-600">—</td>
                  <td className="py-3.5 px-4 text-center">
                    <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-white">Soporte prioritario y puesta en marcha asistida</td>
                  <td className="py-3.5 px-4 text-center text-zinc-600">—</td>
                  <td className="py-3.5 px-4 text-center text-zinc-600">—</td>
                  <td className="py-3.5 px-4 text-center">
                    <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-12 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-400 text-xs mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Preguntas frecuentes</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">¿Tenés preguntas?</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-800/80 bg-zinc-900/20 overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full py-4 px-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-900/40 transition"
                >
                  <span className="font-medium text-sm text-zinc-200">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${
                      isOpen ? "rotate-180 text-white" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-zinc-400 font-light leading-relaxed border-t border-zinc-800/40 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Reassurance Banner */}
      <div className="mt-12 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">¿Listo para modernizar tu negocio?</h4>
              <p className="text-xs text-zinc-400 font-light">
                Creá tu perfil en 30 segundos. Sin tarjeta de crédito y con 14 días de prueba completa.
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
      </div>

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
    </div>
  );
}

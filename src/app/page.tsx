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
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-950 font-bold text-sm">
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
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Agendamiento autónomo &bull; 100% Mobile First</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.12]">
          Tus turnos en piloto automático.{" "}
          <span className="text-zinc-400 font-normal">
            Sin el ida y vuelta por WhatsApp.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto font-light">
          Creá tu perfil profesional con calendario inteligente en 1 minuto. Compartí tu enlace
          en tu bio de Instagram o estado de WhatsApp y recibí reservas confirmadas las 24 hs.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 font-medium text-sm transition shadow-sm flex items-center justify-center gap-2"
          >
            <span>Crear mi perfil gratis</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#preview"
            className="w-full sm:w-auto px-6 py-3 rounded-full border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 text-zinc-300 font-medium text-sm transition flex items-center justify-center gap-2"
          >
            <span>Ver cómo funciona</span>
          </a>
        </div>

        {/* Minimal Stats Row */}
        <div className="mt-16 pt-8 border-t border-zinc-900 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-2">
            <div className="text-2xl font-semibold text-white tracking-tight">0 contraseñas</div>
            <div className="text-xs text-zinc-500 mt-1">Acceso seguro por OTP</div>
          </div>
          <div className="p-2">
            <div className="text-2xl font-semibold text-white tracking-tight">30 seg</div>
            <div className="text-xs text-zinc-500 mt-1">Tiempo de reserva</div>
          </div>
          <div className="p-2">
            <div className="text-2xl font-semibold text-white tracking-tight">24 / 7</div>
            <div className="text-xs text-zinc-500 mt-1">Agenda abierta siempre</div>
          </div>
          <div className="p-2">
            <div className="text-2xl font-semibold text-white tracking-tight">1 click</div>
            <div className="text-xs text-zinc-500 mt-1">WhatsApp e Instagram</div>
          </div>
        </div>
      </section>

      {/* Interactive Product Preview */}
      <section id="preview" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-zinc-900">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            La experiencia de tus clientes
          </h2>
          <p className="text-zinc-400 text-sm mt-2 max-w-md mx-auto font-light">
            Vista móvil minimalista diseñada para reservar en segundos desde cualquier teléfono.
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
                    <h3 className="font-semibold text-white text-xs">Tu Marca o Estudio</h3>
                    <p className="text-[11px] text-zinc-400 font-mono">meet.mankerz.xyz/tunombre</p>
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
                      Día {selectedDay} a las {selectedSlot} hs. Listo para enviar por WhatsApp.
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

      {/* Why Choose Mankerz Meet */}
      <section id="features" className="py-20 px-4 sm:px-6 max-w-5xl mx-auto border-t border-zinc-900">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Diseñado para simplificar tu trabajo
          </h2>
          <p className="text-zinc-400 text-sm mt-2 max-w-md mx-auto font-light">
            Menos configuración, cero contraseñas y una experiencia móvil impecable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900/50 transition">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-200 mb-4">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Sin Contraseñas</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-light">
              Accedé en segundos con un código OTP de 6 dígitos enviado a tu correo. Olvidate de
              claves olvidadas.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900/50 transition">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-200 mb-4">
              <Smartphone className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">100% Mobile First</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-light">
              Tus clientes agendan con una sola mano desde su smartphone. Carga instantánea y sin
              pasos innecesarios.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900/50 transition">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-200 mb-4">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Estética Minimalista</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-light">
              Elegí entre dos estilos sobrios (Minimal Dark o Clean Editorial) adaptados a tu marca
              personal o negocio.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900/50 transition">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-200 mb-4">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">WhatsApp Directo</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-light">
              Confirmación con mensaje pre-redactado para enviar por WhatsApp en un click apenas
              se crea la reserva.
            </p>
          </div>
        </div>
      </section>

      {/* 3 Simple Steps */}
      <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto border-t border-zinc-900">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white tracking-tight">Listo en 3 pasos</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl border border-zinc-800/60 bg-zinc-900/20">
            <span className="text-xs font-mono text-zinc-500 font-bold block mb-2">01</span>
            <h4 className="font-semibold text-white text-sm mb-1">Definí tus Horarios</h4>
            <p className="text-xs text-zinc-400 font-light">
              Elegí qué días atendés, tu franja horaria y la duración de cada turno.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-800/60 bg-zinc-900/20">
            <span className="text-xs font-mono text-zinc-500 font-bold block mb-2">02</span>
            <h4 className="font-semibold text-white text-sm mb-1">Compartí tu Enlace</h4>
            <p className="text-xs text-zinc-400 font-light">
              Pegá tu link <code>meet.mankerz.xyz/tunombre</code> en tu bio de Instagram o WhatsApp.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-800/60 bg-zinc-900/20">
            <span className="text-xs font-mono text-zinc-500 font-bold block mb-2">03</span>
            <h4 className="font-semibold text-white text-sm mb-1">Recibí Turnos</h4>
            <p className="text-xs text-zinc-400 font-light">
              El cliente elige el horario disponible y recibís la confirmación al instante.
            </p>
          </div>
        </div>
      </section>

      {/* Minimalist Templates Showcase (no fake profiles) */}
      <section id="templates" className="py-16 px-4 sm:px-6 max-w-4xl mx-auto border-t border-zinc-900">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white tracking-tight">Dos estilos minimalistas</h2>
          <p className="text-xs text-zinc-400 mt-1 font-light">
            Elegí cómo se ve tu página pública directamente desde tu panel:
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
              Fondo oscuro mate con contraste puro blanco sobre negro. Ideal para barberías,
              estudios creativos, entrenadores y marcas urbanas.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-200 bg-[#fafaf9] text-zinc-900">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Plantilla 02</span>
              <span className="w-2.5 h-2.5 rounded-full bg-white border border-zinc-400" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-950">Clean Editorial</h4>
            <p className="text-xs text-zinc-600 font-light mt-1">
              Lienzo claro en tono papel marfil, líneas sutiles y lectura serena. Perfecto para
              consultorios médicos, psicólogos, nutricionistas y estudios profesionales.
            </p>
          </div>
        </div>
      </section>

      {/* Floating Mobile CTA */}
      <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden">
        <Link
          href="/login"
          className="w-full py-3 px-5 rounded-full bg-white text-zinc-950 font-medium text-xs shadow-xl flex items-center justify-between border border-zinc-200"
        >
          <span>Crear mi perfil gratis</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-900 py-10 px-4 sm:px-6 mt-16 text-center text-xs text-zinc-500">
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

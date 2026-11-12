"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Por favor ingresa un correo electrónico válido.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al enviar código OTP");
      }

      setStep("OTP");
      setCooldown(45);
      setSuccessMsg(`Te enviamos un código de 6 dígitos a ${email}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError("El código debe contener exactamente 6 dígitos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: otpCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Código incorrecto o vencido.");
      }

      setSuccessMsg("Acceso confirmado. Redirigiendo...");
      setTimeout(() => {
        router.push(data.redirectUrl || "/dashboard");
        router.refresh();
      }, 400);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al verificar código");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-center items-center px-4 py-12 selection:bg-zinc-800">
      {/* Brand Header */}
      <Link href="/" className="mb-8 flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-lg bg-white text-zinc-950 font-bold text-sm flex items-center justify-center">
          M
        </div>
        <span className="font-semibold text-base tracking-tight text-white">
          Mankerz Meet
        </span>
      </Link>

      {/* Main Minimalist Card */}
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800/80 bg-[#121215] p-6 sm:p-7 shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold text-white tracking-tight">
            {step === "EMAIL" ? "Acceso sin contraseñas" : "Verificar código"}
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-light">
            {step === "EMAIL"
              ? "Ingresá tu correo y te enviaremos un código de 6 dígitos."
              : `Revisá tu bandeja de entrada (o spam) en ${email}`}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/30 border border-rose-900/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === "EMAIL" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-zinc-300 mb-1.5"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  autoFocus
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl minimal-input text-xs text-white placeholder-zinc-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-medium text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enviando código...</span>
                </>
              ) : (
                <>
                  <span>Enviar código OTP</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label
                htmlFor="otp"
                className="block text-xs font-medium text-zinc-300 mb-1.5"
              >
                Código de 6 dígitos
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  required
                  autoFocus
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl minimal-input text-base font-mono font-bold tracking-[0.3em] text-center text-white placeholder-zinc-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-medium text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ingresar</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-1 text-xs text-zinc-400">
              <button
                type="button"
                onClick={() => {
                  setStep("EMAIL");
                  setOtpCode("");
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="hover:text-white transition"
              >
                &larr; Cambiar e-mail
              </button>
              <button
                type="button"
                onClick={() => handleSendOtp()}
                disabled={loading || cooldown > 0}
                className="hover:text-white transition flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{cooldown > 0 ? `Reenviar (${cooldown}s)` : "Reenviar"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

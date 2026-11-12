import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mankerz Meet | Agendamiento Autónomo y Presencia Digital",
  description:
    "La plataforma SaaS móvil-first para profesionales y comercios. Creá tu perfil con calendario inteligente y eliminá el ida y vuelta por WhatsApp.",
  metadataBase: new URL("https://meet.mankerz.xyz"),
  openGraph: {
    title: "Mankerz Meet - Agendamiento Autónomo",
    description: "Perfil público minimalista y turnos inteligentes sin contraseñas.",
    url: "https://meet.mankerz.xyz",
    siteName: "Mankerz Meet",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#090b10",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-[#090b10] text-gray-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </body>
    </html>
  );
}

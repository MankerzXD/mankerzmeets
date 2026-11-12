import { Resend } from "resend";

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY no está configurada en las variables de entorno."
    );
  }

  return {
    resend: new Resend(apiKey),
    from: process.env.RESEND_FROM_EMAIL || "Mankerz Meet <noreply@mankerz.xyz>",
    appUrl: (
      process.env.NEXT_PUBLIC_APP_URL || "https://meet.mankerz.xyz"
    ).replace(/\/+$/, ""),
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderEmailShell({
  title,
  subtitle,
  bodyHtml,
  footerText,
}: {
  title: string;
  subtitle: string;
  bodyHtml: string;
  footerText: string;
}): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090b; color: #fafafa; padding: 36px 16px;">
      <div style="max-width: 460px; margin: 0 auto; background-color: #121215; border: 1px solid #27272a; border-radius: 16px; padding: 28px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 36px; height: 36px; background-color: #ffffff; color: #09090b; border-radius: 8px; font-weight: 700; font-size: 16px; line-height: 36px; margin: 0 auto 14px;">M</div>
          <h1 style="font-size: 18px; font-weight: 600; margin: 0 0 6px; color: #ffffff;">${escapeHtml(title)}</h1>
          <p style="font-size: 13px; color: #a1a1aa; margin: 0;">${escapeHtml(subtitle)}</p>
        </div>
        ${bodyHtml}
        <p style="font-size: 11px; color: #71717a; text-align: center; margin: 24px 0 0; border-top: 1px solid #27272a; padding-top: 16px;">
          ${escapeHtml(footerText)}
        </p>
      </div>
    </div>
  `;
}

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const { resend, from } = getResendConfig();

  const html = renderEmailShell({
    title: "Código de verificación",
    subtitle: "Ingresá este código de 6 dígitos para acceder a Mankerz Meet.",
    bodyHtml: `
      <div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; font-family: monospace; font-size: 28px; font-weight: 700; letter-spacing: 8px; color: #ffffff; text-align: center;">
        ${escapeHtml(code)}
      </div>
    `,
    footerText:
      "Este código expira en 10 minutos. Si no solicitaste este acceso, podés ignorar este correo.",
  });

  const { error } = await resend.emails.send({
    from,
    to: [email],
    subject: `${code} es tu código de acceso a Mankerz Meet`,
    html,
    text: `Tu código de acceso a Mankerz Meet es: ${code}. Expira en 10 minutos.`,
  });

  if (error) {
    throw new Error(`Error al enviar email con Resend: ${error.message}`);
  }
}

export async function sendBookingNotificationEmails({
  ownerEmail,
  profileName,
  profileSlug,
  formattedDate,
  date,
  startTime,
  endTime,
  customerName,
  customerEmail,
  customerPhone,
  notes,
  whatsappUrl,
}: {
  ownerEmail: string;
  profileName: string;
  profileSlug: string;
  formattedDate: string;
  date: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string | null;
  whatsappUrl: string | null;
}): Promise<{ ownerSent: boolean; customerSent: boolean }> {
  const { resend, from, appUrl } = getResendConfig();

  const cleanCustomerPhone = customerPhone.replace(/[^\d]/g, "");
  const customerWaUrl =
    cleanCustomerPhone.length >= 6
      ? `https://wa.me/${cleanCustomerPhone}`
      : null;

  const startClean = `${date.replace(/-/g, "")}T${startTime.replace(/:/g, "")}00`;
  const endClean = `${date.replace(/-/g, "")}T${endTime.replace(/:/g, "")}00`;
  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    `Turno con ${profileName}`
  )}&dates=${startClean}/${endClean}&details=${encodeURIComponent(
    `Turno agendado en ${appUrl}/${profileSlug}`
  )}`;

  const summaryRows = (rows: Array<[string, string]>) => `
    <div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin-bottom: 18px;">
      ${rows
        .map(
          ([label, val], idx) => `
          <div style="display: flex; justify-content: space-between; font-size: 13px; ${
            idx > 0 ? "margin-top: 10px; padding-top: 10px; border-top: 1px solid #18181b;" : ""
          }">
            <span style="color: #71717a;">${escapeHtml(label)}</span>
            <span style="color: #fafafa; font-weight: 600; text-align: right; margin-left: 12px;">${escapeHtml(val)}</span>
          </div>
        `
        )
        .join("")}
    </div>
  `;

  // 1. Email to Profile Owner
  const ownerRows: Array<[string, string]> = [
    ["Cliente", customerName],
    ["Fecha", formattedDate],
    ["Horario", `${startTime} a ${endTime} hs`],
    ["WhatsApp", customerPhone],
    ["Email", customerEmail],
  ];
  if (notes) ownerRows.push(["Nota", notes]);

  const ownerHtml = renderEmailShell({
    title: "Nuevo turno agendado",
    subtitle: `${customerName} reservó un turno en tu perfil (${profileName}).`,
    bodyHtml: `
      ${summaryRows(ownerRows)}
      <div style="text-align: center;">
        ${
          customerWaUrl
            ? `<a href="${customerWaUrl}" style="display: inline-block; background-color: #ffffff; color: #09090b; text-decoration: none; font-size: 13px; font-weight: 600; padding: 11px 20px; border-radius: 10px; margin-bottom: 10px;">Escribirle por WhatsApp</a><br/>`
            : ""
        }
        <a href="${appUrl}/dashboard" style="display: inline-block; color: #a1a1aa; text-decoration: underline; font-size: 12px; margin-top: 6px;">Ver todos mis turnos en el panel</a>
      </div>
    `,
    footerText: "Notificación automática de Mankerz Meet.",
  });

  // 2. Email to End Customer
  const customerRows: Array<[string, string]> = [
    ["Profesional", profileName],
    ["Fecha", formattedDate],
    ["Horario", `${startTime} a ${endTime} hs`],
  ];
  if (notes) customerRows.push(["Tu nota", notes]);

  const customerHtml = renderEmailShell({
    title: "¡Turno confirmado!",
    subtitle: `Tu reserva con ${profileName} quedó agendada.`,
    bodyHtml: `
      ${summaryRows(customerRows)}
      <div style="text-align: center;">
        <a href="${googleCalUrl}" style="display: inline-block; background-color: #ffffff; color: #09090b; text-decoration: none; font-size: 13px; font-weight: 600; padding: 11px 20px; border-radius: 10px; margin-bottom: 10px;">Agregar a Google Calendar</a>
        ${
          whatsappUrl
            ? `<br/><a href="${whatsappUrl}" style="display: inline-block; color: #a1a1aa; text-decoration: underline; font-size: 12px; margin-top: 6px;">Contactar por WhatsApp</a>`
            : ""
        }
      </div>
    `,
    footerText: `Mankerz Meet • ${appUrl}/${profileSlug}`,
  });

  const tasks: Array<Promise<{ role: "owner" | "customer"; ok: boolean }>> = [
    resend.emails
      .send({
        from,
        to: [ownerEmail],
        subject: `Nuevo turno: ${customerName} — ${formattedDate} (${startTime} hs)`,
        html: ownerHtml,
        text: `Nuevo turno en ${profileName}: ${customerName} (${customerPhone}, ${customerEmail}) el ${formattedDate} de ${startTime} a ${endTime} hs.${notes ? ` Nota: ${notes}` : ""}`,
      })
      .then(({ error }) => {
        if (error) {
          console.error("Resend owner booking email error:", error);
          return { role: "owner" as const, ok: false };
        }
        return { role: "owner" as const, ok: true };
      })
      .catch((err) => {
        console.error("Resend owner booking email exception:", err);
        return { role: "owner" as const, ok: false };
      }),
  ];

  if (customerEmail && customerEmail.includes("@")) {
    tasks.push(
      resend.emails
        .send({
          from,
          to: [customerEmail],
          subject: `Turno confirmado con ${profileName} — ${formattedDate} (${startTime} hs)`,
          html: customerHtml,
          text: `¡Turno confirmado con ${profileName}! Fecha: ${formattedDate}, horario: ${startTime} a ${endTime} hs.`,
        })
        .then(({ error }) => {
          if (error) {
            console.error("Resend customer booking email error:", error);
            return { role: "customer" as const, ok: false };
          }
          return { role: "customer" as const, ok: true };
        })
        .catch((err) => {
          console.error("Resend customer booking email exception:", err);
          return { role: "customer" as const, ok: false };
        })
    );
  }

  const results = await Promise.all(tasks);
  return {
    ownerSent: results.find((r) => r.role === "owner")?.ok ?? false,
    customerSent: results.find((r) => r.role === "customer")?.ok ?? false,
  };
}


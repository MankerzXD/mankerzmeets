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

export interface DepositEmailInfo {
  required: boolean;
  amount?: number | null;
  alias?: string | null;
  cbu?: string | null;
  holder?: string | null;
  notes?: string | null;
}

export async function sendBookingNotificationEmails({
  ownerEmail,
  profileName,
  profileSlug,
  serviceName,
  staffMemberName,
  staffMemberEmail,
  depositInfo,
  formattedDate,
  date,
  startTime,
  endTime,
  customerName,
  customerEmail,
  customerPhone,
  notes,
  whatsappUrl,
  managementCode,
  manageUrl,
  cancelNoticeHours,
  address,
  addressUrl,
}: {
  ownerEmail: string;
  profileName: string;
  profileSlug: string;
  serviceName?: string | null;
  staffMemberName?: string | null;
  staffMemberEmail?: string | null;
  depositInfo?: DepositEmailInfo | null;
  formattedDate: string;
  date: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string | null;
  whatsappUrl: string | null;
  managementCode?: string | null;
  manageUrl?: string | null;
  cancelNoticeHours?: number;
  address?: string | null;
  addressUrl?: string | null;
}): Promise<{ ownerSent: boolean; customerSent: boolean; staffSent?: boolean }> {
  const { resend, from, appUrl } = getResendConfig();

  const cleanCustomerPhone = customerPhone.replace(/[^\d]/g, "");
  const customerWaUrl =
    cleanCustomerPhone.length >= 6
      ? `https://wa.me/${cleanCustomerPhone}`
      : null;

  const startClean = `${date.replace(/-/g, "")}T${startTime.replace(/:/g, "")}00`;
  const endClean = `${date.replace(/-/g, "")}T${endTime.replace(/:/g, "")}00`;
  const calendarTitle = serviceName
    ? `${serviceName} — ${profileName}`
    : `Turno con ${profileName}`;
  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    calendarTitle
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
  ];
  if (serviceName) ownerRows.push(["Tipo de turno", serviceName]);
  if (staffMemberName) ownerRows.push(["Atendido por", staffMemberName]);
  ownerRows.push(
    ["Fecha", formattedDate],
    ["Horario", `${startTime} a ${endTime} hs`],
    ["WhatsApp", customerPhone],
    ["Email", customerEmail]
  );
  if (depositInfo?.required) {
    ownerRows.push([
      "Seña bancaria",
      depositInfo.amount ? `$${depositInfo.amount.toLocaleString("es-AR")} (Pendiente de comprobante)` : "Requerida",
    ]);
  }
  if (notes) ownerRows.push(["Nota", notes]);

  const ownerSubtitle = depositInfo?.required
    ? `${customerName} agendó un turno (Pendiente de verificar comprobante de seña).`
    : `${customerName} reservó un turno en tu perfil (${profileName}).`;

  const ownerHtml = renderEmailShell({
    title: depositInfo?.required ? "Nuevo turno (Seña Pendiente)" : "Nuevo turno agendado",
    subtitle: ownerSubtitle,
    bodyHtml: `
      ${summaryRows(ownerRows)}
      ${
        depositInfo?.required
          ? `<div style="background-color: #1c1917; border: 1px solid #78350f; border-radius: 12px; padding: 14px; margin-bottom: 18px; font-size: 12px; color: #fde68a;">
              ⚠️ <strong>Atención:</strong> Este turno requiere una seña previa de <strong>$${depositInfo.amount ? depositInfo.amount.toLocaleString("es-AR") : ""}</strong>. Verificá la acreditación en tu cuenta bancaria y el comprobante del cliente antes de confirmar.
            </div>`
          : ""
      }
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
    ["Profesional / Local", profileName],
  ];
  if (serviceName) customerRows.push(["Servicio", serviceName]);
  if (staffMemberName) customerRows.push(["Atendido por", staffMemberName]);
  customerRows.push(
    ["Fecha", formattedDate],
    ["Horario", `${startTime} a ${endTime} hs`]
  );
  if (address) customerRows.push(["Dirección", address]);
  if (depositInfo?.required) {
    if (depositInfo.amount) {
      customerRows.push(["Seña a transferir", `$${depositInfo.amount.toLocaleString("es-AR")}`]);
    }
    if (depositInfo.alias) {
      customerRows.push(["Alias bancario", depositInfo.alias]);
    }
    if (depositInfo.holder) {
      customerRows.push(["Titular de la cuenta", depositInfo.holder]);
    }
    if (depositInfo.cbu) {
      customerRows.push(["CBU / CVU", depositInfo.cbu]);
    }
  }
  if (notes) customerRows.push(["Tu nota", notes]);

  const customerTitle = depositInfo?.required
    ? "¡Turno pre-reservado!"
    : "¡Turno confirmado!";
  const customerSubtitle = depositInfo?.required
    ? `Tu turno con ${profileName} está pre-agendado. Transferí la seña para asegurar tu lugar.`
    : `Tu reserva con ${profileName} quedó agendada.`;

  const customerHtml = renderEmailShell({
    title: customerTitle,
    subtitle: customerSubtitle,
    bodyHtml: `
      ${
        depositInfo?.required
          ? `<div style="background-color: #18181b; border: 1px solid #d97706; border-radius: 12px; padding: 16px; margin-bottom: 18px; font-size: 13px; color: #fef3c7;">
              <strong>⚠️ Instrucciones para asegurar tu turno:</strong><br/>
              Transferí la seña de <strong>$${depositInfo.amount ? depositInfo.amount.toLocaleString("es-AR") : ""}</strong> al Alias <strong>${escapeHtml(depositInfo.alias || "")}</strong> y enviá el comprobante por WhatsApp para confirmar tu asistencia.
              ${depositInfo.notes ? `<br/><span style="font-size: 12px; color: #d4d4d8; display: block; margin-top: 6px;">"${escapeHtml(depositInfo.notes)}"</span>` : ""}
            </div>`
          : ""
      }
      ${
        managementCode
          ? `<div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 12px; text-align: center; margin-bottom: 16px;">
              <span style="font-size: 10px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 2px;">Código de turno</span>
              <span style="font-family: monospace; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 2px;">${escapeHtml(managementCode)}</span>
            </div>`
          : ""
      }
      ${summaryRows(customerRows)}
      <div style="text-align: center;">
        <a href="${googleCalUrl}" style="display: inline-block; background-color: #ffffff; color: #09090b; text-decoration: none; font-size: 13px; font-weight: 600; padding: 11px 20px; border-radius: 10px; margin-bottom: 10px;">Agregar a Google Calendar</a>
        ${
          whatsappUrl
            ? `<br/><a href="${whatsappUrl}" style="display: inline-block; color: #a1a1aa; text-decoration: underline; font-size: 12px; margin-top: 6px;">Enviar comprobante por WhatsApp</a>`
            : ""
        }
      </div>
      ${
        manageUrl
          ? `<div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #27272a; text-align: center;">
              <p style="font-size: 12px; color: #a1a1aa; margin: 0 0 10px;">
                ${
                  cancelNoticeHours && cancelNoticeHours > 0
                    ? `¿No podés asistir? Podés cancelar o reprogramar tu turno online hasta <strong>${cancelNoticeHours} hs</strong> antes.`
                    : "¿No podés asistir? Podés cancelar o reprogramar tu turno con 1 clic en cualquier momento."
                }
              </p>
              <a href="${manageUrl}" style="display: inline-block; background-color: #18181b; color: #f43f5e; border: 1px solid #3f3f46; text-decoration: none; font-size: 12px; font-weight: 600; padding: 10px 18px; border-radius: 10px;">
                ¿No podés asistir? Cancelá o reprogramá acá
              </a>
            </div>`
          : ""
      }
    `,
    footerText: `Mankerz Meet • ${appUrl}/${profileSlug}`,
  });

  const tasks: Array<Promise<{ role: "owner" | "customer" | "staff"; ok: boolean }>> = [
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

  if (
    staffMemberEmail &&
    staffMemberEmail.includes("@") &&
    staffMemberEmail.toLowerCase().trim() !== ownerEmail.toLowerCase().trim()
  ) {
    tasks.push(
      resend.emails
        .send({
          from,
          to: [staffMemberEmail],
          subject: `Nuevo turno asignado a vos: ${customerName} — ${formattedDate} (${startTime} hs)`,
          html: ownerHtml,
          text: `Nuevo turno asignado en ${profileName}: ${customerName} (${customerPhone}) el ${formattedDate} de ${startTime} a ${endTime} hs.`,
        })
        .then(({ error }) => {
          if (error) {
            console.error("Resend staff booking email error:", error);
            return { role: "staff" as const, ok: false };
          }
          return { role: "staff" as const, ok: true };
        })
        .catch((err) => {
          console.error("Resend staff booking email exception:", err);
          return { role: "staff" as const, ok: false };
        })
    );
  }

  const results = await Promise.all(tasks);
  return {
    ownerSent: results.find((r) => r.role === "owner")?.ok ?? false,
    customerSent: results.find((r) => r.role === "customer")?.ok ?? false,
    staffSent: results.find((r) => r.role === "staff")?.ok ?? undefined,
  };
}

export async function sendBookingCancelledEmails({
  ownerEmail,
  customerEmail,
  staffMemberEmail,
  profileName,
  profileSlug,
  customerName,
  serviceName,
  staffMemberName,
  formattedDate,
  startTime,
  endTime,
}: {
  ownerEmail: string;
  customerEmail?: string | null;
  staffMemberEmail?: string | null;
  profileName: string;
  profileSlug: string;
  customerName: string;
  serviceName?: string | null;
  staffMemberName?: string | null;
  formattedDate: string;
  startTime: string;
  endTime: string;
}): Promise<{ ownerSent: boolean; customerSent: boolean }> {
  const { resend, from, appUrl } = getResendConfig();

  const detailsHtml = `
    <div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin-bottom: 18px; font-size: 13px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #71717a;">Cliente:</span>
        <span style="color: #fafafa; font-weight: 600;">${escapeHtml(customerName)}</span>
      </div>
      ${serviceName ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-top: 1px solid #18181b; padding-top: 8px;">
          <span style="color: #71717a;">Servicio:</span>
          <span style="color: #fafafa; font-weight: 600;">${escapeHtml(serviceName)}</span>
        </div>` : ""}
      ${staffMemberName ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-top: 1px solid #18181b; padding-top: 8px;">
          <span style="color: #71717a;">Profesional:</span>
          <span style="color: #fafafa; font-weight: 600;">${escapeHtml(staffMemberName)}</span>
        </div>` : ""}
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-top: 1px solid #18181b; padding-top: 8px;">
        <span style="color: #71717a;">Fecha liberada:</span>
        <span style="color: #fafafa; font-weight: 600;">${escapeHtml(formattedDate)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; border-top: 1px solid #18181b; padding-top: 8px;">
        <span style="color: #71717a;">Horario liberado:</span>
        <span style="color: #fafafa; font-weight: 600;">${escapeHtml(startTime)} a ${escapeHtml(endTime)} hs</span>
      </div>
    </div>
  `;

  // 1. Owner notification email
  const ownerHtml = renderEmailShell({
    title: "Turno cancelado por el cliente",
    subtitle: `${customerName} canceló su turno. El horario ha quedado liberado automáticamente.`,
    bodyHtml: `
      ${detailsHtml}
      <div style="text-align: center;">
        <a href="${appUrl}/dashboard" style="display: inline-block; background-color: #ffffff; color: #09090b; text-decoration: none; font-size: 13px; font-weight: 600; padding: 11px 20px; border-radius: 10px;">
          Ver calendario en el panel
        </a>
      </div>
    `,
    footerText: "Notificación de cancelación de Mankerz Meet.",
  });

  const tasks: Array<Promise<boolean>> = [];

  tasks.push(
    resend.emails
      .send({
        from,
        to: [ownerEmail],
        subject: `Turno cancelado: ${customerName} — ${formattedDate} (${startTime} hs)`,
        html: ownerHtml,
        text: `El cliente ${customerName} canceló su turno programado para el ${formattedDate} de ${startTime} a ${endTime} hs. El horario ha sido liberado automáticamente en tu agenda.`,
      })
      .then(({ error }) => !error)
      .catch(() => false)
  );

  // If staff member has email and is distinct from owner, notify them too
  if (
    staffMemberEmail &&
    staffMemberEmail.includes("@") &&
    staffMemberEmail.toLowerCase().trim() !== ownerEmail.toLowerCase().trim()
  ) {
    tasks.push(
      resend.emails
        .send({
          from,
          to: [staffMemberEmail],
          subject: `Turno cancelado: ${customerName} — ${formattedDate} (${startTime} hs)`,
          html: ownerHtml,
          text: `El cliente ${customerName} canceló su turno programado para el ${formattedDate} de ${startTime} a ${endTime} hs. El horario ha sido liberado en tu agenda.`,
        })
        .then(({ error }) => !error)
        .catch(() => false)
    );
  }

  // 2. Customer confirmation email
  let customerTask = Promise.resolve(false);
  if (customerEmail && customerEmail.includes("@")) {
    const customerHtml = renderEmailShell({
      title: "Tu turno ha sido cancelado",
      subtitle: `Cancelaste tu turno con ${profileName}.`,
      bodyHtml: `
        ${detailsHtml}
        <div style="text-align: center;">
          <p style="font-size: 12px; color: #a1a1aa; margin-bottom: 12px;">
            El horario quedó disponible. Podés volver a agendar en cualquier momento cuando desees.
          </p>
          <a href="${appUrl}/${profileSlug}" style="display: inline-block; background-color: #ffffff; color: #09090b; text-decoration: none; font-size: 13px; font-weight: 600; padding: 11px 20px; border-radius: 10px;">
            Reservar un nuevo turno
          </a>
        </div>
      `,
      footerText: `Mankerz Meet • ${appUrl}/${profileSlug}`,
    });

    customerTask = resend.emails
      .send({
        from,
        to: [customerEmail],
        subject: `Turno cancelado con éxito — ${profileName}`,
        html: customerHtml,
        text: `Tu turno con ${profileName} para el ${formattedDate} (${startTime} hs) ha sido cancelado exitosamente.`,
      })
      .then(({ error }) => !error)
      .catch(() => false);
  }

  const [ownerOk, customerOk] = await Promise.all([tasks[0], customerTask]);
  return { ownerSent: Boolean(ownerOk), customerSent: Boolean(customerOk) };
}

export async function sendBookingRescheduledEmails({
  ownerEmail,
  customerEmail,
  staffMemberEmail,
  profileName,
  profileSlug,
  customerName,
  customerPhone,
  serviceName,
  staffMemberName,
  oldFormattedDate,
  oldStartTime,
  newFormattedDate,
  newDate,
  newStartTime,
  newEndTime,
  manageUrl,
  managementCode,
}: {
  ownerEmail: string;
  customerEmail?: string | null;
  staffMemberEmail?: string | null;
  profileName: string;
  profileSlug: string;
  customerName: string;
  customerPhone?: string | null;
  serviceName?: string | null;
  staffMemberName?: string | null;
  oldFormattedDate: string;
  oldStartTime: string;
  newFormattedDate: string;
  newDate: string;
  newStartTime: string;
  newEndTime: string;
  manageUrl?: string | null;
  managementCode?: string | null;
}): Promise<{ ownerSent: boolean; customerSent: boolean }> {
  const { resend, from, appUrl } = getResendConfig();

  const startClean = `${newDate.replace(/-/g, "")}T${newStartTime.replace(/:/g, "")}00`;
  const endClean = `${newDate.replace(/-/g, "")}T${newEndTime.replace(/:/g, "")}00`;
  const calendarTitle = serviceName
    ? `${serviceName} — ${profileName}`
    : `Turno con ${profileName}`;
  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    calendarTitle
  )}&dates=${startClean}/${endClean}&details=${encodeURIComponent(
    `Turno agendado en ${appUrl}/${profileSlug}`
  )}`;

  const summaryHtml = `
    <div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin-bottom: 18px; font-size: 13px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #71717a;">Cliente:</span>
        <span style="color: #fafafa; font-weight: 600;">${escapeHtml(customerName)}</span>
      </div>
      ${serviceName ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-top: 1px solid #18181b; padding-top: 8px;">
          <span style="color: #71717a;">Servicio:</span>
          <span style="color: #fafafa; font-weight: 600;">${escapeHtml(serviceName)}</span>
        </div>` : ""}
      ${staffMemberName ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-top: 1px solid #18181b; padding-top: 8px;">
          <span style="color: #71717a;">Profesional:</span>
          <span style="color: #fafafa; font-weight: 600;">${escapeHtml(staffMemberName)}</span>
        </div>` : ""}
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-top: 1px solid #18181b; padding-top: 8px;">
        <span style="color: #71717a;">Horario anterior:</span>
        <span style="color: #ef4444; text-decoration: line-through;">${escapeHtml(oldFormattedDate)} (${escapeHtml(oldStartTime)} hs)</span>
      </div>
      <div style="display: flex; justify-content: space-between; border-top: 1px solid #18181b; padding-top: 8px;">
        <span style="color: #10b981; font-weight: 600;">Nuevo horario:</span>
        <span style="color: #10b981; font-weight: 700;">${escapeHtml(newFormattedDate)} de ${escapeHtml(newStartTime)} a ${escapeHtml(newEndTime)} hs</span>
      </div>
    </div>
  `;

  // 1. Owner notification
  const ownerHtml = renderEmailShell({
    title: "Turno reprogramado por el cliente",
    subtitle: `${customerName} cambió la fecha u hora de su turno.`,
    bodyHtml: `
      ${summaryHtml}
      <div style="text-align: center;">
        <a href="${appUrl}/dashboard" style="display: inline-block; background-color: #ffffff; color: #09090b; text-decoration: none; font-size: 13px; font-weight: 600; padding: 11px 20px; border-radius: 10px;">
          Ver cambios en el panel
        </a>
      </div>
    `,
    footerText: "Notificación de reprogramación de Mankerz Meet.",
  });

  const tasks: Array<Promise<boolean>> = [];

  tasks.push(
    resend.emails
      .send({
        from,
        to: [ownerEmail],
        subject: `Turno reprogramado: ${customerName} — ${newFormattedDate} (${newStartTime} hs)`,
        html: ownerHtml,
        text: `El cliente ${customerName} reprogramó su turno del ${oldFormattedDate} al ${newFormattedDate} (${newStartTime} a ${newEndTime} hs).`,
      })
      .then(({ error }) => !error)
      .catch(() => false)
  );

  if (
    staffMemberEmail &&
    staffMemberEmail.includes("@") &&
    staffMemberEmail.toLowerCase().trim() !== ownerEmail.toLowerCase().trim()
  ) {
    tasks.push(
      resend.emails
        .send({
          from,
          to: [staffMemberEmail],
          subject: `Turno reprogramado: ${customerName} — ${newFormattedDate} (${newStartTime} hs)`,
          html: ownerHtml,
          text: `El cliente ${customerName} reprogramó su turno del ${oldFormattedDate} al ${newFormattedDate} (${newStartTime} a ${newEndTime} hs).`,
        })
        .then(({ error }) => !error)
        .catch(() => false)
    );
  }

  // 2. Customer confirmation
  let customerTask = Promise.resolve(false);
  if (customerEmail && customerEmail.includes("@")) {
    const customerHtml = renderEmailShell({
      title: "¡Tu turno ha sido reprogramado!",
      subtitle: `Actualizamos con éxito tu reserva con ${profileName}.`,
      bodyHtml: `
        ${
          managementCode
            ? `<div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 12px; text-align: center; margin-bottom: 16px;">
                <span style="font-size: 10px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 2px;">Código de turno</span>
                <span style="font-family: monospace; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 2px;">${escapeHtml(managementCode)}</span>
              </div>`
            : ""
        }
        ${summaryHtml}
        <div style="text-align: center;">
          <a href="${googleCalUrl}" style="display: inline-block; background-color: #ffffff; color: #09090b; text-decoration: none; font-size: 13px; font-weight: 600; padding: 11px 20px; border-radius: 10px; margin-bottom: 10px;">
            Actualizar Google Calendar
          </a>
          ${
            manageUrl
              ? `<div style="margin-top: 14px;">
                  <a href="${manageUrl}" style="color: #a1a1aa; font-size: 12px; text-decoration: underline;">
                    Ver o gestionar este turno
                  </a>
                </div>`
              : ""
          }
        </div>
      `,
      footerText: `Mankerz Meet • ${appUrl}/${profileSlug}`,
    });

    customerTask = resend.emails
      .send({
        from,
        to: [customerEmail],
        subject: `Turno reprogramado con éxito — ${profileName} (${newFormattedDate})`,
        html: customerHtml,
        text: `Tu turno con ${profileName} fue reprogramado para el ${newFormattedDate} de ${newStartTime} a ${newEndTime} hs.`,
      })
      .then(({ error }) => !error)
      .catch(() => false);
  }

  const [ownerOk, customerOk] = await Promise.all([tasks[0], customerTask]);
  return { ownerSent: Boolean(ownerOk), customerSent: Boolean(customerOk) };
}

export async function sendBookingReminderEmail({
  customerEmail,
  customerName,
  profileName,
  profileSlug,
  whatsapp,
  serviceName,
  staffMemberName,
  formattedDate,
  date,
  startTime,
  endTime,
  managementCode,
  manageUrl,
  address,
  addressUrl,
  reminderType = "24H",
}: {
  customerEmail: string;
  customerName: string;
  profileName: string;
  profileSlug: string;
  whatsapp?: string | null;
  serviceName?: string | null;
  staffMemberName?: string | null;
  formattedDate: string;
  date: string;
  startTime: string;
  endTime: string;
  managementCode?: string | null;
  manageUrl?: string | null;
  address?: string | null;
  addressUrl?: string | null;
  reminderType?: "24H" | "2H" | "MANUAL";
}): Promise<boolean> {
  const { resend, from, appUrl } = getResendConfig();

  const cleanPhone = (whatsapp || "").replace(/[^\d]/g, "");
  const whatsappUrl =
    cleanPhone.length >= 8
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
          `Hola ${profileName}, tengo un turno agendado (${managementCode || ""}) para el ${formattedDate} a las ${startTime} hs.`
        )}`
      : null;

  const startClean = `${date.replace(/-/g, "")}T${startTime.replace(/:/g, "")}00`;
  const endClean = `${date.replace(/-/g, "")}T${endTime.replace(/:/g, "")}00`;
  const calendarTitle = serviceName
    ? `${serviceName} — ${profileName}`
    : `Turno con ${profileName}`;
  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    calendarTitle
  )}&dates=${startClean}/${endClean}&details=${encodeURIComponent(
    `Turno en ${appUrl}/${profileSlug}`
  )}`;

  let title = "Recordatorio de tu turno";
  let subtitle = `¡Hola ${customerName}! Te recordamos tu cita con ${profileName}.`;
  let subject = `Recordatorio: Tenés un turno con ${profileName} — ${formattedDate} (${startTime} hs)`;

  if (reminderType === "24H") {
    title = "Tu turno es mañana";
    subtitle = `¡Hola ${customerName}! Mañana tenés tu cita agendada con ${profileName}.`;
    subject = `Recordatorio: Tu turno con ${profileName} es mañana (${startTime} hs)`;
  } else if (reminderType === "2H") {
    title = "Tu turno es en 2 horas";
    subtitle = `¡Hola ${customerName}! En un par de horas tenés tu turno con ${profileName}.`;
    subject = `⏰ En 2 horas: Tu turno con ${profileName} (${startTime} hs)`;
  }

  const detailsRows: Array<[string, string]> = [
    ["Profesional / Local", profileName],
  ];
  if (serviceName) detailsRows.push(["Servicio", serviceName]);
  if (staffMemberName) detailsRows.push(["Atendido por", staffMemberName]);
  detailsRows.push(
    ["Fecha", formattedDate],
    ["Horario", `${startTime} a ${endTime} hs`]
  );
  if (address) detailsRows.push(["Dirección", address]);

  const summaryRowsHtml = `
    <div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin-bottom: 18px;">
      ${detailsRows
        .map(
          ([label, val], idx) => `
          <div style="display: flex; justify-content: space-between; font-size: 13px; ${
            idx > 0
              ? "margin-top: 10px; padding-top: 10px; border-top: 1px solid #18181b;"
              : ""
          }">
            <span style="color: #71717a;">${escapeHtml(label)}</span>
            <span style="color: #fafafa; font-weight: 600; text-align: right; margin-left: 12px;">${escapeHtml(
              val
            )}</span>
          </div>
        `
        )
        .join("")}
    </div>
  `;

  const html = renderEmailShell({
    title,
    subtitle,
    bodyHtml: `
      ${
        managementCode
          ? `<div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 12px; text-align: center; margin-bottom: 16px;">
              <span style="font-size: 10px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 2px;">Código de turno</span>
              <span style="font-family: monospace; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 2px;">${escapeHtml(
                managementCode
              )}</span>
            </div>`
          : ""
      }
      ${summaryRowsHtml}
      <div style="text-align: center;">
        <a href="${googleCalUrl}" style="display: inline-block; background-color: #ffffff; color: #09090b; text-decoration: none; font-size: 13px; font-weight: 600; padding: 11px 20px; border-radius: 10px; margin-bottom: 10px;">
          Ver en Google Calendar
        </a>
        ${
          whatsappUrl
            ? `<br/><a href="${whatsappUrl}" style="display: inline-block; color: #a1a1aa; text-decoration: underline; font-size: 12px; margin-top: 4px;">Escribir al local por WhatsApp</a>`
            : ""
        }
      </div>
      ${
        manageUrl
          ? `<div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #27272a; text-align: center;">
              <p style="font-size: 12px; color: #a1a1aa; margin: 0 0 10px;">
                ¿Surgió un imprevisto y no vas a poder asistir?
              </p>
              <a href="${manageUrl}" style="display: inline-block; background-color: #18181b; color: #f43f5e; border: 1px solid #3f3f46; text-decoration: none; font-size: 12px; font-weight: 600; padding: 10px 18px; border-radius: 10px;">
                Cancelar o reprogramar mi turno acá
              </a>
            </div>`
          : ""
      }
    `,
    footerText: `Mankerz Meet • ${appUrl}/${profileSlug}`,
  });

  try {
    const { error } = await resend.emails.send({
      from,
      to: [customerEmail],
      subject,
      html,
      text: `Recordatorio de turno con ${profileName}: ${formattedDate} de ${startTime} a ${endTime} hs.${
        managementCode ? ` Código: ${managementCode}.` : ""
      }${manageUrl ? ` Para cancelar o reprogramar ingresá a: ${manageUrl}` : ""}`,
    });
    if (error) {
      console.error("Resend reminder email error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend reminder email exception:", err);
    return false;
  }
}


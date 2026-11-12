# ⚡ Mankerz Meet (meet.mankerz.xyz)

> **Plataforma SaaS ultrarrápida, móvil-first y minimalista** para que profesionales, barberías, consultorios médicos, psicólogos, coaches y comercios creen su perfil público y permitan a sus clientes agendar turnos de forma 100% autónoma, eliminando para siempre el ida y vuelta por WhatsApp.

---

## 🚀 Características Principales

1. **Landing Page de Presentación (`/`)**:
   - Estética moderna tech-wear / dark-mode con toques de Glassmorphism, degradados sutiles y tipografía de alto contraste.
   - Simulador interactivo en vivo de reserva en smartphone (demo funcional en la misma pantalla).
   - Métricas y comparativas de valor (0 contraseñas, 100% Mobile First, WhatsApp & Instagram directo).
   - Enlace directo a perfiles demo reales (`/carlos-fade`, `/dra-valeria-nutricion`).

2. **Autenticación Passwordless (Sin Contraseñas vía OTP) (`/login`)**:
   - Registro e inicio de sesión con solo ingresar el correo electrónico.
   - Generación de código OTP de 6 dígitos con vencimiento a 10 minutos.
   - En entorno de desarrollo, el código se exhibe en consola y en un banner de prueba para agilizar testing.
   - Sesión emitida mediante JWT seguro (`jose`) almacenada en cookie HTTP-only `mankerz_session`.

3. **Panel del Inquilino / Profesional (`/dashboard`)**:
   - **Gestión de Agenda:** Listado de reservas en tiempo real con datos de cliente, horarios, notas y botón directo para abrir conversación en WhatsApp.
   - **Configuración de Disponibilidad:** Matriz visual para los 7 días de la semana (Lunes a Domingo), horario de apertura/cierre, receso de almuerzo y duración de turnos (15, 30, 45 o 60 min).
   - **Personalización Visual:**
     - Subida/URL de foto de perfil y banner de fondo.
     - Selector de plantillas predefinidas: **Minimal Dark** (Techwear / Glass) vs **Clean Editorial** (Sleek Minimal).
   - **Redes y Contacto:** Configuración de número de WhatsApp con formato internacional (+54 9 11...) y usuario de Instagram.
   - **Compartir Perfil:** Botón flotante para copiar enlace directo `meet.mankerz.xyz/[slug]` o visualizar perfil público.

4. **Vista Pública del Perfil (`/[slug]`)**:
   - Diseñado estrictamente **Mobile-First**.
   - **Calendario del Mes Completo:** Días pasados o sin disponibilidad atenuados ("destilados") de forma que el cliente identifique de inmediato los huecos libres.
   - **Despliegue de Turnos:** Cálculo dinámico de intervalos disponibles excluyendo turnos ya reservados y descansos.
   - **Reserva en 1 Paso:** Formulario con datos mínimos requeridos y confirmación instantánea con enlace pre-formateado a WhatsApp para notificar al profesional.

5. **Panel SuperAdmin Exclusivo (`/admin`)**:
   - **Restricción Estricta:** Acceso restringido por código y middleware únicamente al correo **`sanchezmanuel397@gmail.com`**.
   - **Métricas Globales:** Total de usuarios, perfiles activos, suspendidos y turnos totales en la plataforma.
   - **Gestión de Suscripciones SaaS:** Tabla con todos los inquilinos y botón de acción para **suspender o reactivar cuentas por falta de pago**. Si una cuenta es suspendida, su perfil público muestra un aviso de pausa temporal.

---

## 🏗️ Arquitectura de Base de Datos (Prisma)

El modelo está diseñado para máxima compatibilidad con **PostgreSQL** y **SQLite**:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  role      String   @default("USER") // "USER" | "SUPERADMIN"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  profile   Profile?
  otps      OtpCode[]
}

model OtpCode {
  id        String   @id @default(cuid())
  email     String
  code      String
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Profile {
  id           String   @id @default(cuid())
  userId       String   @unique
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  slug         String   @unique // URL handle: meet.mankerz.xyz/[slug]
  name         String
  title        String   // Especialidad (ej: "Master Barber", "Nutricionista")
  bio          String?
  avatarUrl    String?
  bannerUrl    String?
  template     String   @default("MINIMAL_DARK") // "MINIMAL_DARK" | "CLEAN_EDITORIAL"
  whatsapp     String   // Formato internacional ej: "5491122334455"
  instagram    String?  // Usuario de Instagram sin @
  status       String   @default("ACTIVE") // "ACTIVE" | "SUSPENDED" (Control de pago SuperAdmin)
  slotDuration Int      @default(30) // Minutos por turno
  bufferTime   Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  availabilities Availability[]
  bookings       Booking[]
}

model Availability {
  id             String   @id @default(cuid())
  profileId      String
  profile        Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  dayOfWeek      Int      // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  startTime      String   // "09:00"
  endTime        String   // "18:00"
  isActive       Boolean  @default(true)
  breakStartTime String?  // "13:00"
  breakEndTime   String?  // "14:00"
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([profileId, dayOfWeek])
}

model Booking {
  id            String   @id @default(cuid())
  profileId     String
  profile       Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  customerName  String
  customerEmail String
  customerPhone String
  date          String   // "YYYY-MM-DD"
  startTime     String   // "10:00"
  endTime       String   // "10:30"
  notes         String?
  status        String   @default("CONFIRMED") // "CONFIRMED" | "CANCELLED" | "COMPLETED"
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

## 📁 Estructura del Proyecto

```text
mankerz-meet/
├── prisma/
│   ├── schema.prisma          # Definición de modelos Prisma (PostgreSQL / SQLite)
│   └── seed.ts                # Semilla de datos (SuperAdmin + Carlos Fade + Dra. Valeria)
├── src/
│   ├── app/
│   │   ├── [slug]/            # Vista pública mobile-first del perfil
│   │   │   ├── page.tsx       # Server component con Suspense boundary
│   │   │   └── profile-client.tsx # Calendario interactivo de mes completo y reserva
│   │   ├── admin/             # Panel SuperAdmin (protegido para sanchezmanuel397@gmail.com)
│   │   │   └── page.tsx
│   │   ├── dashboard/         # Tenant dashboard (Disponibilidad, Personalización, Turnos)
│   │   │   └── page.tsx
│   │   ├── login/             # Login / Registro Passwordless con OTP
│   │   │   └── page.tsx
│   │   ├── api/
│   │   │   ├── admin/tenants/route.ts       # SuperAdmin: listado y suspensión por falta de pago
│   │   │   ├── auth/
│   │   │   │   ├── otp/send/route.ts        # Emisión de código OTP
│   │   │   │   ├── otp/verify/route.ts      # Verificación de OTP y seteo de cookie
│   │   │   │   ├── logout/route.ts
│   │   │   │   └── me/route.ts              # Sesión actual
│   │   │   ├── dashboard/
│   │   │   │   ├── availability/route.ts    # Configuración semanal de horarios
│   │   │   │   ├── bookings/route.ts        # Turnos del usuario
│   │   │   │   └── profile/route.ts         # Datos, estética y redes del perfil
│   │   │   └── public/[slug]/
│   │   │       ├── route.ts                 # Información pública del perfil
│   │   │       ├── slots/route.ts           # Cálculo de huecos libres por fecha
│   │   │       └── book/route.ts            # Agendamiento y generación de link WhatsApp
│   │   ├── globals.css        # Tailwind v4, estilos tech-wear y glassmorphism
│   │   ├── layout.tsx         # Root layout con metadatos y modo oscuro permanente
│   │   └── page.tsx           # Landing page de presentación
│   ├── components/
│   │   └── icons.tsx          # Iconos SVG de Instagram y WhatsApp
│   └── lib/
│       ├── auth.ts            # Utilidades JWT (jose), hashing OTP y control SuperAdmin
│       ├── prisma.ts          # Singleton de cliente Prisma
│       ├── time-slots.ts      # Motor de cálculo y filtrado de horarios disponibles
│       └── utils.ts           # Utilidades de formato de fechas en español y Tailwind
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🛠️ Puesta en Marcha Local

### 1. Clonar e Instalar Dependencias
```bash
npm install
```

### 2. Sincronizar Base de Datos y Sembrar Datos Demo
```bash
npx prisma db push
npx prisma db seed
```

El script de semilla creará:
- **SuperAdmin**: `sanchezmanuel397@gmail.com`
- **Inquilino Demo 1**: `carlos@fadebarber.com` (Perfil: `/carlos-fade` con plantilla *Minimal Dark*)
- **Inquilino Demo 2**: `valeria@nutrimed.com` (Perfil: `/dra-valeria-nutricion` con plantilla *Clean Editorial*)

### 3. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

---

## 🐘 Cómo desplegar en PostgreSQL (Neon / Supabase / Railway / RDS)

1. En `prisma/schema.prisma`, cambiar la línea de `provider`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. En tu archivo `.env` o en las variables de entorno de tu proveedor de hosting:
   ```env
   DATABASE_URL="postgresql://usuario:password@host.postgres.database.azure.com:5432/mankerzmeet?sslmode=require"
   JWT_SECRET="clave-super-secreta-de-produccion-32-caracteres"
   SUPERADMIN_EMAIL="sanchezmanuel397@gmail.com"
   NEXT_PUBLIC_APP_URL="https://meet.mankerz.xyz"
   ```
3. Ejecutar la migración:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```
4. ¡Listo! Todo el código es 100% compatible sin requerir ningún cambio en TypeScript.

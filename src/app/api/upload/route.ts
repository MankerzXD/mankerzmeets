import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabaseAdmin, PROFILE_MEDIA_BUCKET } from "@/lib/supabase";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const kind = (formData.get("kind") as string) || "avatar";

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No se recibió ningún archivo de imagen." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Formato no soportado. Usá JPG, PNG, WEBP o GIF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "La imagen supera el límite de 4 MB." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Ensure bucket exists if service_role permissions allow
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === PROFILE_MEDIA_BUCKET);
    if (!exists) {
      await supabase.storage.createBucket(PROFILE_MEDIA_BUCKET, {
        public: true,
        fileSizeLimit: MAX_SIZE_BYTES,
      });
    }

    const ext = file.type.split("/")[1] || "png";
    const safeKind = kind === "banner" ? "banner" : "avatar";
    const filePath = `${session.userId}/${safeKind}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(PROFILE_MEDIA_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: publicData } = supabase.storage
      .from(PROFILE_MEDIA_BUCKET)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicData.publicUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al subir la imagen a Supabase Storage.",
      },
      { status: 500 }
    );
  }
}


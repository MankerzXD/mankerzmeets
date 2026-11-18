import { NextResponse } from "next/server";
import sharp from "sharp";
import { getSession } from "@/lib/auth";
import { getSupabaseAdmin, PROFILE_MEDIA_BUCKET } from "@/lib/supabase";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB (will be compressed down to <100 KB)

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
        { error: "La imagen supera el límite de 10 MB." },
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

    const safeKind = kind === "banner" ? "banner" : "avatar";
    const originalBuffer = Buffer.from(await file.arrayBuffer());

    let finalBuffer: Buffer = originalBuffer;
    let finalContentType = file.type;
    let fileExt = file.type.split("/")[1] || "png";

    // Server-side compression using sharp
    try {
      if (file.type !== "image/gif") {
        if (safeKind === "banner") {
          // Banner: max width 1600, max height 600, fit inside, high quality WebP
          finalBuffer = await sharp(originalBuffer)
            .resize({
              width: 1600,
              height: 600,
              fit: "inside",
              withoutEnlargement: true,
            })
            .webp({ quality: 82, effort: 4 })
            .toBuffer();
        } else {
          // Avatar (Profile & Staff): max width 600, max height 600, fit cover, crisp WebP
          finalBuffer = await sharp(originalBuffer)
            .resize({
              width: 600,
              height: 600,
              fit: "cover",
              withoutEnlargement: true,
            })
            .webp({ quality: 82, effort: 4 })
            .toBuffer();
        }

        finalContentType = "image/webp";
        fileExt = "webp";
      }
    } catch (compressErr) {
      console.warn("Sharp compression fallback to original buffer:", compressErr);
      finalBuffer = originalBuffer;
    }

    const filePath = `${session.userId}/${safeKind}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(PROFILE_MEDIA_BUCKET)
      .upload(filePath, finalBuffer, {
        contentType: finalContentType,
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
      sizeBytes: finalBuffer.length,
      format: fileExt,
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


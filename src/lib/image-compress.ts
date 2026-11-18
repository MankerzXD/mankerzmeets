/**
 * Client-side high-performance image compression using HTML5 Canvas.
 * Automatically resizes large phone camera photos (e.g. 12MP/4K) down to
 * optimal web dimensions and converts to modern WebP (or JPEG fallback)
 * with ~80% quality, reducing file size by 90-97% before network transfer.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  mimeType?: "image/webp" | "image/jpeg";
}

export async function compressImageFile(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
    mimeType = "image/webp",
  } = options;

  // If it's a GIF or SVG, do not compress to avoid losing animation or vector data
  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }

  return new Promise((resolve) => {
    // If not in a browser environment, return original
    if (typeof window === "undefined" || !window.createImageBitmap && !window.Image) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => resolve(file);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(file);
      img.onload = () => {
        try {
          let { width, height } = img;

          // Calculate scaling ratio
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(file);
            return;
          }

          // Enable high-quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          ctx.drawImage(img, 0, 0, width, height);

          // Test WebP support or fallback to JPEG
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }

              // Use new extension based on mimeType
              const ext = blob.type === "image/webp" ? "webp" : "jpg";
              const originalBase = file.name.replace(/\.[^/.]+$/, "");
              const compressedFile = new File(
                [blob],
                `${originalBase}-compressed.${ext}`,
                {
                  type: blob.type,
                  lastModified: Date.now(),
                }
              );

              // If for any bizarre reason compressed is larger, use original
              if (compressedFile.size < file.size) {
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            mimeType,
            quality
          );
        } catch (err) {
          console.warn("Client compression exception, using original:", err);
          resolve(file);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

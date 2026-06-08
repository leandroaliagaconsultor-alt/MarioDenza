import { readFile } from "fs/promises";
import path from "path";

/**
 * Devuelve el logo como data URI base64 para embeberlo en los PDF.
 * Intenta leerlo del filesystem (dev / build con public incluido) y,
 * si falla, lo baja del propio origen. Si todo falla, devuelve null
 * y los templates renderizan sin logo.
 */
export async function loadLogoDataUri(origin?: string): Promise<string | null> {
  try {
    const buf = await readFile(path.join(process.cwd(), "public", "logo.png"));
    return `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    // sigue al fallback
  }
  if (origin) {
    try {
      const res = await fetch(`${origin}/logo.png`);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        return `data:image/png;base64,${buf.toString("base64")}`;
      }
    } catch {
      // sin logo
    }
  }
  return null;
}

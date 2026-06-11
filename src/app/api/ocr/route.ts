import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractContractFromPdf, extractContractFromText } from "@/lib/ocr/extract-contract";

const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function POST(request: NextRequest) {
  // Verify authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY no configurada" },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
    }

    const name = file.name.toLowerCase();
    const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
    const isDocx = file.type === DOCX_TYPE || name.endsWith(".docx");

    if (!isPdf && !isDocx) {
      return NextResponse.json(
        { error: "Solo se aceptan PDF o Word (.docx). Si tenés un .doc viejo, guardalo como .docx o PDF." },
        { status: 400 }
      );
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo no debe superar 10MB" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();

    let extracted;
    if (isPdf) {
      const base64 = Buffer.from(buffer).toString("base64");
      extracted = await extractContractFromPdf(base64);
    } else {
      // Word (.docx): extraemos el texto y se lo pasamos a la IA como texto plano.
      const mammoth = (await import("mammoth")).default;
      const { value: text } = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
      if (!text || text.trim().length < 20) {
        return NextResponse.json(
          { error: "No se pudo leer texto del Word. Probá guardarlo como PDF y subir ese." },
          { status: 400 }
        );
      }
      extracted = await extractContractFromText(text);
    }

    return NextResponse.json({ data: extracted });
  } catch (error) {
    console.error("OCR error:", error);
    return NextResponse.json(
      { error: "No se pudieron extraer los datos del documento. Intentá con otro archivo o cargá los datos manualmente." },
      { status: 500 }
    );
  }
}

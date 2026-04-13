"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Upload, FileText, Image, Trash2, ExternalLink } from "lucide-react";
import { uploadDocument, deleteDocument } from "@/lib/documents/actions";
import { DOCUMENT_CATEGORIES } from "@/lib/types/enums";
import type { DocumentCategory } from "@/lib/types/enums";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Doc {
  id: string;
  file_url: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  category: string;
  created_at: string;
}

interface Props {
  entityType: "property" | "contract" | "tenant" | "owner";
  entityId: string;
  documents: Doc[];
}

export function DocumentUpload({ entityType, entityId, documents }: Props) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState<DocumentCategory>("contrato");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await uploadDocument(entityType, entityId, category, formData);
      toast.success(`"${file.name}" subido`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Eliminar "${name}"?`)) return;
    try {
      await deleteDocument(id);
      toast.success("Documento eliminado");
      router.refresh();
    } catch {
      toast.error("Error al eliminar");
    }
  }

  function formatSize(bytes: number | null) {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const isImage = (mime: string | null) => mime?.startsWith("image/");

  return (
    <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
        <FileText className="h-5 w-5 text-gray-400" /> Documentos ({documents.length})
      </h2>
      <Separator className="my-4" />

      {/* Upload */}
      <div className="flex items-end gap-3 mb-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Categoria</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as DocumentCategory)}
            className="block rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
          >
            {Object.entries(DOCUMENT_CATEGORIES).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="relative">
          <input
            type="file"
            onChange={handleUpload}
            disabled={uploading}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
          <Button variant="outline" disabled={uploading}>
            {uploading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}
            {uploading ? "Subiendo..." : "Subir archivo"}
          </Button>
        </div>
      </div>

      {/* List */}
      {documents.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">Sin documentos</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
              <div className="flex items-center gap-3">
                {isImage(doc.mime_type) ? (
                  <Image className="h-5 w-5 text-blue-500" />
                ) : (
                  <FileText className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{doc.file_name}</p>
                  <p className="text-xs text-gray-400">
                    {DOCUMENT_CATEGORIES[doc.category as DocumentCategory]} · {formatSize(doc.file_size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm"><ExternalLink className="h-3.5 w-3.5" /></Button>
                </a>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id, doc.file_name)}>
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

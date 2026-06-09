import Link from "next/link";
import { FileSpreadsheet, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { CsvImporter } from "./csv-importer";

export default function ImportarPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Importar datos"
        description="Importa dueños, inquilinos y propiedades desde archivos CSV"
        backHref="/configuracion"
      />

      <Link
        href="/configuracion/importar/contratos"
        className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50/60 px-5 py-4 shadow-sm transition-colors hover:bg-teal-100/60"
      >
        <FileSpreadsheet className="h-5 w-5 shrink-0 text-teal-600" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900">Importar contratos desde Excel</p>
          <p className="text-xs text-gray-500">Crea dueños, inquilinos, propiedades y contratos con su ajuste, en una pasada con preview.</p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
      </Link>

      <CsvImporter />
    </div>
  );
}

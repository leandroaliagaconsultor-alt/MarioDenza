import { PageHeader } from "@/components/ui/page-header";
import { CsvImporter } from "./csv-importer";

export default function ImportarPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Importar datos"
        description="Importa duenos, inquilinos y propiedades desde archivos CSV"
        backHref="/configuracion"
      />
      <CsvImporter />
    </div>
  );
}

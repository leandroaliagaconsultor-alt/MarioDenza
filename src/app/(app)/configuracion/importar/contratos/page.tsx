import { PageHeader } from "@/components/ui/page-header";
import { ContractsImporter } from "../contracts-importer";

export default function ImportarContratosPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Importar contratos"
        description="Carga masiva desde el Excel: dueños, inquilinos, propiedades, contratos y su ajuste"
        backHref="/configuracion/importar"
      />
      <ContractsImporter />
    </div>
  );
}

import { PageHeader } from "@/components/ui/page-header";
import { getIndexValues } from "./actions";
import { IndexManager } from "./index-form";

export default async function IndicesPage() {
  const entries = await getIndexValues();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Indices ICL / IPC"
        description="Carga y consulta los valores de indices para calcular aumentos"
        backHref="/configuracion"
      />
      <IndexManager entries={entries} />
    </div>
  );
}

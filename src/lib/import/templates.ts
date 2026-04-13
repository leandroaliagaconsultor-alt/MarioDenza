import { generateCsv } from "@/lib/export/csv";

export const IMPORT_TEMPLATES = {
  owners: {
    label: "Duenos",
    headers: ["nombre_completo", "dni_cuit", "telefono", "email", "direccion", "banco", "cbu", "alias", "notas"],
    example: [["Juan Perez", "20-12345678-9", "2324-401234", "jperez@email.com", "Calle 25 N 100", "Provincia", "0140000000000001", "juan.perez", ""]],
  },
  tenants: {
    label: "Inquilinos",
    headers: ["nombre_completo", "dni", "telefono", "email", "notas"],
    example: [["Maria Garcia", "35678901", "2324-501234", "mgarcia@email.com", ""]],
  },
  properties: {
    label: "Propiedades",
    headers: ["direccion", "unidad", "ciudad", "provincia", "tipo", "nombre_dueno", "estado", "notas"],
    example: [["Calle 25 N 450", "Depto A", "Mercedes", "Buenos Aires", "residencial", "Juan Perez", "disponible", ""]],
  },
} as const;

export type ImportEntityType = keyof typeof IMPORT_TEMPLATES;

export function generateTemplate(entityType: ImportEntityType): string {
  const tmpl = IMPORT_TEMPLATES[entityType];
  return generateCsv(tmpl.headers as unknown as string[], tmpl.example as unknown as string[][]);
}

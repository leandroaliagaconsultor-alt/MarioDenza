"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { generateCsv, downloadCsv } from "@/lib/export/csv";

interface Props {
  headers: string[];
  rows: string[][];
  filename: string;
}

export function ExportButton({ headers, rows, filename }: Props) {
  function handleExport() {
    const csv = generateCsv(headers, rows);
    downloadCsv(csv, filename);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="mr-1.5 h-4 w-4" /> Exportar CSV
    </Button>
  );
}

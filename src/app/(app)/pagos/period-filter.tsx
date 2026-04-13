"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  periods: string[];
}

export function PeriodFilter({ periods }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("period") || "";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("period", value);
    } else {
      params.delete("period");
    }
    params.delete("page");
    router.push(`/pagos?${params.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={(e) => handleChange(e.target.value)}
      className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-sm"
    >
      <option value="">Todos los meses</option>
      {periods.map((p) => (
        <option key={p} value={p}>{p}</option>
      ))}
    </select>
  );
}

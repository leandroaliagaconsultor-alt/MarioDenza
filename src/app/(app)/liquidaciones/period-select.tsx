"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  periods: string[];
  current: string;
}

export function PeriodSelect({ periods, current }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const options = periods.includes(current) ? periods : [current, ...periods];

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    router.push(`/liquidaciones?${params.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={(e) => handleChange(e.target.value)}
      className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
    >
      {options.map((p) => (
        <option key={p} value={p}>{p}</option>
      ))}
    </select>
  );
}
